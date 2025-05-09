// app/(main)/ingest-data/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"
import { UserPlus, ShoppingCart, List } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Zod schema for Customer form
const customerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  totalSpends: z.coerce.number().min(0).optional().default(0), // coerce converts string from input to number
  visitCount: z.coerce.number().int().min(0).optional().default(0),
  lastActiveDate: z.string().optional(), // Input type="datetime-local"
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

// Zod schema for Order form
const orderFormSchema = z.object({
  orderId: z.string().min(1, {
    message: "Order ID is required.",
  }),
  customerId: z.string().min(1, { // We'll fetch customers to populate a select or suggest using an existing ID
    message: "Customer ID is required.",
  }),
  orderAmount: z.coerce.number().min(0, {
    message: "Order amount must be a positive number.",
  }),
  orderDate: z.string(), // Input type="datetime-local"
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface ICustomerOption {
  _id: string;
  name: string;
  email: string;
}

export default function IngestDataPage() {
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [customers, setCustomers] = useState<ICustomerOption[]>([]);
  const [apiMessage, setApiMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


  // Fetch customers for the order form's customerId field
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast("Could not load customers for selection.");
      }
    };
    fetchCustomers();
  }, []);


  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      totalSpends: 0,
      visitCount: 0,
      lastActiveDate: new Date().toISOString().slice(0, 16), // For datetime-local format
    },
  });

  const orderForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderId: `ORD-${Date.now().toString().slice(-6)}`, // Example default order ID
      customerId: "",
      orderAmount: 0,
      orderDate: new Date().toISOString().slice(0, 16),
    },
  });

  async function onCustomerSubmit(data: CustomerFormValues) {
    setIsLoadingCustomer(true);
    setApiMessage(null);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Ensure lastActiveDate is sent in a format the backend expects (ISO string)
          lastActiveDate: data.lastActiveDate ? new Date(data.lastActiveDate).toISOString() : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create customer");
      }
      toast(`Customer "${result.customer.name}" created successfully.`);
      customerForm.reset();
      setApiMessage({type: 'success', text: `Customer "${result.customer.name}" created!`});
      // Re-fetch customers to update the dropdown in the order form
      const custResponse = await fetch("/api/customers");
      const custData = await custResponse.json();
      setCustomers(custData.customers || []);

    } catch (error: any) {
      console.error("Customer submission error:", error);
      toast(error.message);
      setApiMessage({type: 'error', text: error.message || "Could not create customer."});
    } finally {
      setIsLoadingCustomer(false);
    }
  }

  async function onOrderSubmit(data: OrderFormValues) {
    setIsLoadingOrder(true);
    setApiMessage(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          orderDate: new Date(data.orderDate).toISOString(), // Ensure ISO string
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create order");
      }
      toast(`Order "${result.order.orderId}" created successfully.`,);
      orderForm.reset({
        ...orderForm.getValues(), // keep customerId if user wants to add multiple orders for same customer
        orderId: `ORD-${Date.now().toString().slice(-6)}`, // new default order ID
        orderAmount: 0,
        orderDate: new Date().toISOString().slice(0, 16),
      });
      setApiMessage({type: 'success', text: `Order "${result.order.orderId}" created!`});
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast( error.message  );
      setApiMessage({type: 'error', text: error.message || "Could not create order."});
    } finally {
      setIsLoadingOrder(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight flex items-center">
        <List className="mr-2 h-8 w-8" /> Data Ingestion
      </h1>
      
      {apiMessage && (
        <div className={`p-4 rounded-md text-sm ${apiMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {apiMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-6 w-6" /> Add New Customer
            </CardTitle>
            <CardDescription>
              Enter the details of a new customer to add them to the CRM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...customerForm}>
              <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-6">
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
                <FormField
                  control={customerForm.control}
                  name="totalSpends"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Spends (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={customerForm.control}
                  name="visitCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Count (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={customerForm.control}
                  name="lastActiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Active Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoadingCustomer} className="w-full">
                  {isLoadingCustomer ? "Adding Customer..." : "Add Customer"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-6 w-6" /> Add New Order
            </CardTitle>
            <CardDescription>
              Log a new order for an existing customer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-6">
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
                           <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="" disabled>Select a customer</option>
                            {customers.map(customer => (
                              <option key={customer._id} value={customer._id}>
                                {customer.name} ({customer.email})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input placeholder="Enter Customer ID (Create customer first)" {...field} />
                        )}
                      </FormControl>
                      <FormDescription>
                        Select an existing customer or ensure you have their ID.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button type="submit" disabled={isLoadingOrder} className="w-full">
                  {isLoadingOrder ? "Adding Order..." : "Add Order"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
       <Separator className="my-8" />
        <div>
            <h2 className="text-2xl font-semibold mb-4">View Data (Test)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={async () => {
                    const res = await fetch('/api/customers');
                    const data = await res.json();
                    console.log('Customers:', data);
                    toast('Customers Fetched');
                }}>Fetch All Customers</Button>
                <Button onClick={async () => {
                    const res = await fetch('/api/orders');
                    const data = await res.json();
                    console.log('Orders:', data);
                    toast('Orders Fetched');
                }}>Fetch All Orders</Button>
            </div>
        </div>
    </div>
  );
}
