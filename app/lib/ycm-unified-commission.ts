import {calculateCommissionSplit,validateCommissionRule,YcmCommissionRule} from './ycm-commission-engine';

export type UnifiedCommissionRule=Pick<YcmCommissionRule,'partnerPercent'|'referralPercent'|'ycmPercent'> & {referralFundedBy?:'agent'|'ycm'};
export type UnifiedAllocation={grossAmountPaise:number;ycmPaise:number;agentPaise:number;referralPaise:number;agentNetPaise:number;ycmNetPaise:number;totalAllocatedPaise:number};

export function calculateUnifiedAllocation(grossAmountPaise:number,rule:UnifiedCommissionRule):UnifiedAllocation{
 const referral=rule.referralPercent??0;
 validateCommissionRule({partnerPercent:rule.partnerPercent,referralPercent:0,ycmPercent:rule.ycmPercent});
 if(!Number.isFinite(referral)||referral<0||referral>rule.partnerPercent)throw new Error('REFERRAL_PERCENT_INVALID');
 const base=calculateCommissionSplit(grossAmountPaise,{partnerPercent:rule.partnerPercent,referralPercent:0,ycmPercent:rule.ycmPercent});
 if(rule.referralFundedBy==='ycm'){
  const ycmNet=base.ycmPaise-Math.floor(grossAmountPaise*referral/100);
  if(ycmNet<0)throw new Error('REFERRAL_EXCEEDS_YCM_SHARE');
  return {grossAmountPaise,ycmPaise:ycmNet,agentPaise:base.partnerPaise,referralPaise:Math.floor(grossAmountPaise*referral/100),agentNetPaise:base.partnerPaise,ycmNetPaise:ycmNet,totalAllocatedPaise:grossAmountPaise};
 }
 const referralPaise=Math.floor(grossAmountPaise*referral/100);
 const agentNet=base.partnerPaise-referralPaise;
 if(agentNet<0)throw new Error('REFERRAL_EXCEEDS_AGENT_SHARE');
 return {grossAmountPaise,ycmPaise:base.ycmPaise,agentPaise:agentNet,referralPaise,agentNetPaise:agentNet,ycmNetPaise:base.ycmPaise,totalAllocatedPaise:grossAmountPaise};
}

export function defaultServiceCommissionRule():UnifiedCommissionRule{
 return {partnerPercent:40,referralPercent:0,ycmPercent:60,referralFundedBy:'agent'};
}
