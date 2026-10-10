import postgres from 'postgres';

export type YcmFinancialSummary={monthStart:string;revenuePaise:number;employeeExpensePaise:number;officeExpensePaise:number;marketingExpensePaise:number;operationsExpensePaise:number;totalExpensePaise:number;profitBeforeOtherCostsPaise:number};
function db(){const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;return url?postgres(url,{max:3,prepare:false,connect_timeout:10,idle_timeout:20}):null;}
export async function getCompanyFinancialSummary(months=12):Promise<YcmFinancialSummary[]>{
 const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED');
 const safeMonths=Math.min(Math.max(Math.trunc(months),1),24);
 try{const rows=await sql`SELECT month_start,revenue_paise,employee_expense_paise,office_expense_paise,marketing_expense_paise,operations_expense_paise,total_expense_paise FROM ycm_company_financial_monthly ORDER BY month_start DESC LIMIT ${safeMonths}`;return rows.map(r=>({monthStart:String(r.month_start),revenuePaise:Number(r.revenue_paise),employeeExpensePaise:Number(r.employee_expense_paise),officeExpensePaise:Number(r.office_expense_paise),marketingExpensePaise:Number(r.marketing_expense_paise),operationsExpensePaise:Number(r.operations_expense_paise),totalExpensePaise:Number(r.total_expense_paise),profitBeforeOtherCostsPaise:Number(r.revenue_paise)-Number(r.total_expense_paise)}));}finally{await sql.end({timeout:3});}
}