/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  UserPlus,
  ShoppingCart,
  Users,
  Upload,
  FileText,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileUp,
} from "lucide-react"
import { useState, useEffect, Fragment } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
// import { auth } from "@/auth"
// import { redirect } from "next/dist/server/api-utils"

// Zod schema for Customer form
const customerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  totalSpends: z.coerce.number().min(0), // coerce converts string from input to number
  visitCount: z.coerce.number().int().min(0),
  lastActiveDate: z.string().optional(), // Input type="datetime-local"
})

type CustomerFormValues = z.infer<typeof customerFormSchema>

// Zod schema for Order form
const orderFormSchema = z.object({
  orderId: z.string().min(1, {
    message: "Order ID is required.",
  }),
  customerId: z.string().min(1, {
    // We'll fetch customers to populate a select or suggest using an existing ID
    message: "Customer ID is required.",
  }),
  orderAmount: z.coerce.number().min(0, {
    message: "Order amount must be a positive number.",
  }),
  orderDate: z.string(), // Input type="datetime-local"
})

type OrderFormValues = z.infer<typeof orderFormSchema>

interface ICustomerOption {
  _id: string
  name: string
  email: string
}


// New DataDisplayModal Component
interface DataDisplayModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[] | null
  dataType: 'customer' | 'order'
  onDeleteCustomer?: (id: string) => void;
}

const DataDisplayModal: React.FC<DataDisplayModalProps> = ({ isOpen, onClose, title, data, dataType,onDeleteCustomer }) => {
  if (!isOpen) return null

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch (e) {
      return dateString // Return original if formatting fails
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <div key={index} className="bg-muted/30 p-4 rounded-md shadow-sm border">
                {dataType === 'customer' && (
                  <div className="space-y-1.5 text-sm">
                    <p><strong>Name:</strong> {item.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {item.email || 'N/A'}</p>
                    <p><strong>Total Spends:</strong> ${item.totalSpends?.toFixed(2) || '0.00'}</p>
                    <p><strong>Visit Count:</strong> {item.visitCount || 0}</p>
                    <p><strong>Last Active:</strong> {formatDate(item.lastActiveDate)}</p>
                    <p><strong>Joined:</strong> {formatDate(item.createdAt)}</p>
                    <p className="text-xs text-muted-foreground pt-1">ID: {item._id}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm("Are you sure you want to delete this customer?")) {
                          onDeleteCustomer?.(item._id); // 👈 Use passed handler
                        }
                      }}
                      className="mt-3"
                    >
                      Delete Customer
                    </Button>
                  </div>
                )}
                {dataType === 'order' && (
                  <div className="space-y-1.5 text-sm">
                    <p><strong>Order ID:</strong> {item.orderId || 'N/A'}</p>
                    <p><strong>Customer:</strong> {item.customerId ? (typeof item.customerId === 'object' ? `${item.customerId.name || 'N/A'} (ID: ${item.customerId._id || 'N/A'})` : item.customerId) : 'N/A'}</p>
                    <p><strong>Amount:</strong> ${item.orderAmount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Order Date:</strong> {formatDate(item.orderDate)}</p>
                    <p><strong>Logged:</strong> {formatDate(item.createdAt)}</p>
                     <p className="text-xs text-muted-foreground pt-1">ID: {item._id}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No data available or an error occurred.</p>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function IngestDataPage() {
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [customers, setCustomers] = useState<ICustomerOption[]>([])
  const [apiMessage, setApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedOrderFile, setSelectedOrderFile] = useState<File | null>(null)
  const [isUploadingCsv, setIsUploadingCsv] = useState(false)
  const [isUploadingOrderCsv, setIsUploadingOrderCsv] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [orderUploadProgress, setOrderUploadProgress] = useState(0)
  const { data: session, status } = useSession();
  const router = useRouter()
  
    useEffect(() => {
      if (status !== "authenticated") {
        toast.error("You must be signed in to view this page.")
        setTimeout(() => {
            router.push("/sign-in");
        }, 750);
        
      }
    }, [status,router]);
  const [uploadResults, setUploadResults] = useState<{
    successfulUploads: number
    failedUploads: number
    errors: any[]
  } | null>(null)
  const [uploadOrderResults, setUploadOrderResults] = useState<{
    successfulUploads: number
    failedUploads: number
    errors: any[]
  } | null>(null)
  const [activeTab, setActiveTab] = useState("individual")
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: "DELETE",
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete customer");
      }
  
      // Success toast
      toast.success("Customer deleted successfully");
  
      // Refresh modal data
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomerModalData(data.customers || []);
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(error.message || "Failed to delete customer");
    }
  };
  // State for modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [customerModalData, setCustomerModalData] = useState<any[] | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderModalData, setOrderModalData] = useState<any[] | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
      setUploadResults(null) // Clear previous results
    }
  }

  const handleOrderFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedOrderFile(event.target.files[0])
      setUploadOrderResults(null) // Clear previous results
    }
  }

  const simulateProgress = (setProgressFn: React.Dispatch<React.SetStateAction<number>>, duration = 2000) => {
    setProgressFn(0)
    const interval = 30
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const newProgress = Math.min(Math.floor((currentStep / steps) * 100), 95)
      setProgressFn(newProgress)
      if (currentStep >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }

  const handleCustomerBulkUpload = async () => {
    if (!selectedFile) {
      toast("Please select a CSV file to upload.")
      return
    }
    setIsUploadingCsv(true)
    setUploadResults(null)
    const formData = new FormData()
    formData.append("csvFile", selectedFile)

    // Simulate progress
    const clearProgressSimulation = simulateProgress(setUploadProgress)

    try {
      const response = await fetch("/api/customers/bulk-upload", {
        method: "POST",
        body: formData, // No 'Content-Type' header needed, browser sets it for FormData
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "CSV upload failed.")
      }
      setUploadProgress(100)
      setUploadResults(data)
      toast.success(`${data.successfulUploads} customers uploaded, ${data.failedUploads} failed.`)
    } catch (error: any) {
      toast.error(error.message)
      setUploadResults({
        successfulUploads: 0,
        failedUploads: 0,
        errors: [{ message: error.message }],
      }) // Basic error display
    } finally {
      clearProgressSimulation()
      setTimeout(() => setIsUploadingCsv(false), 500) // Give time for progress to complete
    }
  }

  const handleOrderBulkUpload = async () => {
    if (!selectedOrderFile) {
      toast("Please select a CSV file to upload.")
      return
    }
    setIsUploadingOrderCsv(true)
    setUploadOrderResults(null)
    const formData = new FormData()
    formData.append("csvFile", selectedOrderFile)

    // Simulate progress
    const clearProgressSimulation = simulateProgress(setOrderUploadProgress)

    try {
      const response = await fetch("/api/orders/bulk-upload", {
        method: "POST",
        body: formData, // No 'Content-Type' header needed, browser sets it for FormData
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "CSV upload failed.")
      }
      setOrderUploadProgress(100)
      setUploadOrderResults(data)
      toast.success(`${data.successfulUploads} orders uploaded, ${data.failedUploads} failed.`)
    } catch (error: any) {
      toast.error(error.message)
      setUploadOrderResults({
        successfulUploads: 0,
        failedUploads: 0,
        errors: [{ message: error.message }],
      }) // Basic error display
    } finally {
      clearProgressSimulation()
      setTimeout(() => setIsUploadingOrderCsv(false), 500) // Give time for progress to complete
    }
  }

  // Fetch customers for the order form's customerId field
  useEffect(() => {
    const fetchCustomers = async () => {
      
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) {
          throw new Error("Failed to fetch customers")
        }
        const data = await response.json()
        setCustomers(data.customers || [])
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast.error("Could not load customers for selection.")
      }
    }
    fetchCustomers()
  }, [])

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      totalSpends: 0,
      visitCount: 0,
      lastActiveDate: new Date().toISOString().slice(0, 16), // For datetime-local format
    },
  })

  const orderForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderId: `ORD-${Date.now().toString().slice(-6)}`, // Example default order ID
      customerId: "",
      orderAmount: 0,
      orderDate: new Date().toISOString().slice(0, 16),
    },
  })

  async function onCustomerSubmit(data: CustomerFormValues) {
    setIsLoadingCustomer(true)
    setApiMessage(null)
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Ensure lastActiveDate is sent in a format the backend expects (ISO string)
          lastActiveDate: data.lastActiveDate ? new Date(data.lastActiveDate).toISOString() : undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Failed to create customer")
      }
      toast.success(`Customer "${result.customer.name}" created successfully.`)
      customerForm.reset()
      setApiMessage({ type: "success", text: `Customer "${result.customer.name}" created!` })
      // Re-fetch customers to update the dropdown in the order form
      const custResponse = await fetch("/api/customers")
      const custData = await custResponse.json()
      setCustomers(custData.customers || [])
    } catch (error: any) {
      console.error("Customer submission error:", error)
      toast.error(error.message)
      setApiMessage({ type: "error", text: error.message || "Could not create customer." })
    } finally {
      setIsLoadingCustomer(false)
    }
  }

  async function onOrderSubmit(data: OrderFormValues) {
    setIsLoadingOrder(true)
    setApiMessage(null)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          orderDate: new Date(data.orderDate).toISOString(), // Ensure ISO string
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || "Failed to create order")
      }
      toast.success(`Order "${result.order.orderId}" created successfully.`)
      orderForm.reset({
        ...orderForm.getValues(), // keep customerId if user wants to add multiple orders for same customer
        orderId: `ORD-${Date.now().toString().slice(-6)}`, // new default order ID
        orderAmount: 0,
        orderDate: new Date().toISOString().slice(0, 16),
      })
      setApiMessage({ type: "success", text: `Order "${result.order.orderId}" created!` })
    } catch (error: any) {
      console.error("Order submission error:", error)
      toast.error(error.message)
      setApiMessage({ type: "error", text: error.message || "Could not create order." })
    } finally {
      setIsLoadingOrder(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Database className="mr-2 h-8 w-8 text-primary" /> Data Ingestion
          </h1>
          <p className="text-muted-foreground mt-1">Add customers and orders to your CRM database</p>
        </div>
      </div>

      {apiMessage && (
        <Alert
          variant={apiMessage.type === "success" ? "default" : "destructive"}
          className={
            apiMessage.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : undefined
          }
        >
          <AlertTitle>{apiMessage.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{apiMessage.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="individual" className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" /> Individual Entry
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1">
            <Upload className="h-4 w-4" /> Bulk Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-primary" /> Add New Customer
                </CardTitle>
                <CardDescription>Enter the details of a new customer to add them to the CRM</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...customerForm}>
                  <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                    <FormField
                      control={customerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={customerForm.control}
                        name="totalSpends"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Spends</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">Optional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="visitCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Count</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">Optional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={customerForm.control}
                      name="lastActiveDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Active Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoadingCustomer} className="w-full">
                      {isLoadingCustomer ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Adding Customer...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Add Customer
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Add New Order
                </CardTitle>
                <CardDescription>Log a new order for an existing customer</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...orderForm}>
                  <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-4">
                    <FormField
                      control={orderForm.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ORD-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orderForm.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <FormControl>
                            {customers.length > 0 ? (
                              <select
                                {...field}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="" disabled>
                                  Select a customer
                                </option>
                                {customers.map((customer) => (
                                  <option key={customer._id} value={customer._id}>
                                    {customer.name} ({customer.email})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input placeholder="Enter Customer ID (Create customer first)" {...field} />
                            )}
                          </FormControl>
                          <FormDescription className="text-xs">
                            Select an existing customer or ensure you have their ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={orderForm.control}
                        name="orderAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="199.99" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orderForm.control}
                        name="orderDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Date</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isLoadingOrder} className="w-full">
                      {isLoadingOrder ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Adding Order...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" /> Add Order
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" /> Bulk Upload Customers
                </CardTitle>
                <CardDescription>Upload a CSV file with multiple customer records at once</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Upload CSV File</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>
                            Required columns: name, email
                            <br />
                            Optional: totalSpends, visitCount, lastActiveDate (ISO format)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20">
                    <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {selectedFile && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <p className="text-sm">{selectedFile.name}</p>
                      </div>
                    )}
                  </div>

                  {isUploadingCsv && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <Button
                    onClick={handleCustomerBulkUpload}
                    disabled={isUploadingCsv || !selectedFile}
                    className="w-full"
                  >
                    {isUploadingCsv ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" /> Upload Customers
                      </>
                    )}
                  </Button>
                </div>

                {uploadResults && (
                  <div className="rounded-md border bg-muted/20 p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-primary" /> Upload Results
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Successful</p>
                          <p className="text-xl font-bold">{uploadResults.successfulUploads}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Failed</p>
                          <p className="text-xl font-bold">{uploadResults.failedUploads}</p>
                        </div>
                      </div>
                    </div>

                    {uploadResults.errors && uploadResults.errors.length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-medium text-sm mb-2">Error Details:</h5>
                        <div className="max-h-40 overflow-y-auto bg-background/50 rounded-md p-2 text-xs">
                          <ul className="space-y-1">
                            {uploadResults.errors.map((err, idx) => (
                              <li key={idx} className="border-b border-muted pb-1 last:border-0 last:pb-0">
                                <span className="font-medium">Row {err.row || "N/A"}</span>
                                {err.email && <span> (Email: {err.email})</span>}: {err.message}
                                {err.details && (
                                  <pre className="mt-1 text-xs overflow-x-auto">
                                    {JSON.stringify(err.details, null, 2)}
                                  </pre>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Bulk Upload Orders
                </CardTitle>
                <CardDescription>Upload a CSV file with multiple order records at once</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Upload CSV File</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>
                            Required columns: orderId, customerId
                            <br />
                            Optional: orderAmount, orderDate (ISO format)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20">
                    <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleOrderFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {selectedOrderFile && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <p className="text-sm">{selectedOrderFile.name}</p>
                      </div>
                    )}
                  </div>

                  {isUploadingOrderCsv && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{orderUploadProgress}%</span>
                      </div>
                      <Progress value={orderUploadProgress} className="h-2" />
                    </div>
                  )}

                  <Button
                    onClick={handleOrderBulkUpload}
                    disabled={isUploadingOrderCsv || !selectedOrderFile}
                    className="w-full"
                  >
                    {isUploadingOrderCsv ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" /> Upload Orders
                      </>
                    )}
                  </Button>
                </div>

                {uploadOrderResults && (
                  <div className="rounded-md border bg-muted/20 p-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-primary" /> Upload Results
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Successful</p>
                          <p className="text-xl font-bold">{uploadOrderResults.successfulUploads}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Failed</p>
                          <p className="text-xl font-bold">{uploadOrderResults.failedUploads}</p>
                        </div>
                      </div>
                    </div>

                    {uploadOrderResults.errors && uploadOrderResults.errors.length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-medium text-sm mb-2">Error Details:</h5>
                        <div className="max-h-40 overflow-y-auto bg-background/50 rounded-md p-2 text-xs">
                          <ul className="space-y-1">
                            {uploadOrderResults.errors.map((err, idx) => (
                              <li key={idx} className="border-b border-muted pb-1 last:border-0 last:pb-0">
                                <span className="font-medium">Row {err.row || "N/A"}</span>
                                {err.orderId && <span> (Order ID: {err.orderId})</span>}: {err.message}
                                {err.details && (
                                  <pre className="mt-1 text-xs overflow-x-auto">
                                    {JSON.stringify(err.details, null, 2)}
                                  </pre>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="mr-2 h-5 w-5 text-primary" /> Data Management Tools
          </CardTitle>
          <CardDescription>View and manage your CRM data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch("/api/customers");
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Failed to fetch customers");
                  setCustomerModalData(data.customers || []);
                  setIsCustomerModalOpen(true);
                } catch (error: any) {
                  toast.error(error.message);
                  setCustomerModalData(null);
                  setIsCustomerModalOpen(true);
                }
              }}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Users className="h-6 w-6 mb-2" />
              <span>View All Customers</span>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                // const res = await fetch("/api/orders")
                // const data = await res.json()
                // console.log("Orders:", data)
                // toast.success("Orders data fetched to console")
                try {
                  const res = await fetch("/api/orders")
                  const data = await res.json()
                  console.log("Orders:", data)
                  if (!res.ok) throw new Error(data.message || "Failed to fetch orders")
                  setOrderModalData(data.orders || [])
                  setIsOrderModalOpen(true)
                } catch (error: any) {
                  toast.error(error.message)
                  setOrderModalData(null) // Ensure modal shows error/no data
                  setIsOrderModalOpen(true) // Open modal to show error message
                }
              }}
              className="h-20 flex flex-col items-center justify-center"
            >
              <ShoppingCart className="h-6 w-6 mb-2" />
              <span>View All Orders</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            For development & testing purposes, I have printed the data in console too.
          </p>
        </CardFooter>
      </Card>

      {/* Modals */}
      <DataDisplayModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="All Customers"
        data={customerModalData}
        dataType="customer"
        onDeleteCustomer={handleDeleteCustomer} // 👈 Add this line

      />
      <DataDisplayModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="All Orders"
        data={orderModalData}
        dataType="order"
      />
    </div>
  )
}

function Label({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
