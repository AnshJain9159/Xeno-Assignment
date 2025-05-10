/* eslint-disable @typescript-eslint/no-explicit-any */
import { AudienceRuleSet, IRuleGroup, IRuleCondition } from '@/models/campaign';
import mongoose from 'mongoose';

const buildMongoQuery = (ruleSet: AudienceRuleSet): mongoose.FilterQuery<any> => {
  const parseGroup = (group: IRuleGroup): mongoose.FilterQuery<any> => {
    const mongoConditions: mongoose.FilterQuery<any>[] = [];
    group.conditions.forEach(condition => {
      mongoConditions.push(parseCondition(condition));
    });
    if (group.groups && group.groups.length > 0) {
      group.groups.forEach(subGroup => {
        mongoConditions.push(parseGroup(subGroup));
      });
    }
    if (mongoConditions.length === 0) return {};
    if (mongoConditions.length === 1) return mongoConditions[0];
    return group.logicalOperator === 'AND' ? { $and: mongoConditions } : { $or: mongoConditions };
  };
  const parseCondition = (condition: IRuleCondition): mongoose.FilterQuery<any> => {
    const { field, operator, value } = condition;
    let queryValue = value;
    if (field === 'lastActiveDate' && (operator === 'OLDER_THAN_DAYS' || operator === 'IN_LAST_DAYS')) {
      const days = Number(value);
      if (isNaN(days)) throw new Error(`Invalid number of days for ${operator}: ${value}`);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      if (operator === 'OLDER_THAN_DAYS') return { [field]: { $lt: dateThreshold } };
      return { [field]: { $gte: dateThreshold } };
    } else if (condition.dataType === 'date') {
        queryValue = new Date(value as string);
        if (isNaN(queryValue.getTime())) throw new Error(`Invalid date value for ${field}: ${value}`);
    }
    let mongoOperator: string;
    switch (operator) {
      case 'EQUALS': mongoOperator = '$eq'; break;
      case 'NOT_EQUALS': mongoOperator = '$ne'; break;
      case 'GREATER_THAN': mongoOperator = '$gt'; break;
      case 'LESS_THAN': mongoOperator = '$lt'; break;
      case 'CONTAINS': mongoOperator = '$regex'; queryValue = new RegExp(String(value), 'i').toString(); break;
      case 'STARTS_WITH': mongoOperator = '$regex'; queryValue = new RegExp('^' + String(value), 'i').toString(); break;
      case 'ENDS_WITH': mongoOperator = '$regex'; queryValue = new RegExp(String(value) + '$', 'i').toString(); break;
      default: throw new Error(`Unsupported operator: ${operator}`);
    }
    return { [field]: { [mongoOperator]: queryValue } };
  };
  return parseGroup(ruleSet);
};
 export default buildMongoQuery;