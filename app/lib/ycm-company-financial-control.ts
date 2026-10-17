import postgres from 'postgres';

export type CompanyFinanceAccessRole='ceo'|'management'|'admin';
export function assertCompanyFinanceRole(role:string):asserts role is CompanyFinanceAccessRole{if(!['ceo','management','admin'].includes(role))throw new Error('FORBIDDEN');}
function db(){const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;return url?postgres(url,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null;}
export async function getCompanyFinancialControlSummary(months=12){
 const sql=db();if(!sql)throw new Error('DATABASE_NOT_CONFIGURED'); const safe=Math.min(Math.max(Math.trunc(months),1),24);
 try{
  const monthly=await sql`SELECT month_start,revenue_paise,employee_expense_paise,office_expense_paise,marketing_expense_paise,operations_expense_paise,total_expense_paise FROM ycm_company_financial_monthly ORDER BY month_start DESC LIMIT ${safe}`;
  const assets=await sql`SELECT COUNT(*)::int AS count,COALESCE(SUM(current_value_paise),0)::bigint AS current_value_paise FROM ycm_company_assets WHERE status<>'disposed'`;
  const openBudgets=await sql`SELECT COUNT(*)::int AS count,COALESCE(SUM(budget_amount_paise),0)::bigint AS budget_amount_paise FROM ycm_company_budgets WHERE status='active' AND period_end>=CURRENT_DATE`;
  return {monthly,assets:assets[0],activeBudgets:openBudgets[0]};
 }finally{await sql.end({timeout:3});}
}
