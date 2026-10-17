import fs from 'node:fs';
const migration=fs.readFileSync('database/migrations/032_company_financial_control.sql','utf8');
const report=fs.readFileSync('app/lib/ycm-company-financial-report.ts','utf8');
for(const n of ['ycm_company_expenses','ycm_company_assets','ycm_company_budgets','ycm_company_revenue','ycm_company_financial_monthly']) if(!migration.includes(n)) throw new Error('migration missing '+n);
for(const n of ['employeeExpensePaise','officeExpensePaise','marketingExpensePaise','operationsExpensePaise','profitBeforeOtherCostsPaise']) if(!report.includes(n)) throw new Error('report missing '+n);
console.log('Company financial control contract OK');