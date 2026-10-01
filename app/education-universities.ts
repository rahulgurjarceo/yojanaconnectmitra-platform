export type UniversityRecord = {
  id:string;
  name:string;
  state:string;
  type:"CENTRAL"|"STATE"|"DEEMED"|"PRIVATE"|"STATE_OPEN"|"CENTRAL_OPEN";
  universityRecognisedSource:string;
  odlonlineStatus:"VERIFY_LIVE"|"ODL_RECOGNISED_2025_26"|"ONLINE_ENTITLED_2025_26";
  officialWebsite?:string;
  notes?:string;
};

export const UGC_UNIVERSITY_DIRECTORY = {
  source:"UGC University Directory",
  url:"https://www.ugc.gov.in/universitydetails/university/",
  currentCounts:{central:57,state:523,deemed:161,private:560},
  verification:"Always verify current UGC status before displaying a university as recognised."
} as const;

export const UGC_DEB_DIRECTORY = {
  source:"UGC Distance Education Bureau — HEI/Programme List",
  url:"https://deb.ugc.ac.in/Home/HEI_Prog_List",
  rule:"ODL/Online recognition is programme/session specific and must be checked before admission."
} as const;

/**
 * Open/state-open universities seeded from UGC-DEB records and official university
 * categories. This is a discovery layer; the live UGC-DEB list remains authoritative.
 */
export const OPEN_UNIVERSITIES: UniversityRecord[] = [
  ["Dr. B.R. Ambedkar Open University","Telangana","STATE_OPEN"],
  ["Krishna Kanta Handiqui State Open University","Assam","STATE_OPEN"],
  ["Nalanda Open University","Bihar","STATE_OPEN"],
  ["Chhattisgarh Mukta Shiksha (Open) University","Chhattisgarh","STATE_OPEN"],
  ["Dr. Babasaheb Ambedkar Open University","Gujarat","STATE_OPEN"],
  ["Himachal Pradesh University","Himachal Pradesh","STATE"],
  ["Karnataka State Open University","Karnataka","STATE_OPEN"],
  ["Sreenarayanaguru Open University","Kerala","STATE_OPEN"],
  ["Yashwantrao Chavan Maharashtra Open University","Maharashtra","STATE_OPEN"],
  ["Madhya Pradesh Bhoj (Open) University","Madhya Pradesh","STATE_OPEN"],
  ["Odisha State Open University","Odisha","STATE_OPEN"],
  ["Vardhman Mahaveer Open University","Rajasthan","STATE_OPEN"],
  ["Jagat Guru Nanak Dev Punjab State Open University","Punjab","STATE_OPEN"],
  ["Tamil Nadu Open University","Tamil Nadu","STATE_OPEN"],
  ["U.P. Rajarshi Tandon Open University","Uttar Pradesh","STATE_OPEN"],
  ["Uttarakhand Open University","Uttarakhand","STATE_OPEN"],
  ["Netaji Subhas Open University","West Bengal","STATE_OPEN"],
  ["Indira Gandhi National Open University","Delhi","CENTRAL_OPEN"],
].map(([name,state,type])=>({
  id:slug(name),name,state,
  type:type as UniversityRecord["type"],
  universityRecognisedSource:UGC_UNIVERSITY_DIRECTORY.url,
  odlonlineStatus:"VERIFY_LIVE" as const,
  notes:"Open-university discovery record. Verify current UGC-DEB session/programme recognition before admission."
}));

export function slug(value:string){
  return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export type UniversitySearchResult = UniversityRecord & {
  verificationUrl:string;
};

export function searchEducationUniversities(query:string):UniversitySearchResult[]{
  const q=query.trim().toLowerCase();
  return OPEN_UNIVERSITIES
    .filter(u=>!q || `${u.name} ${u.state} ${u.type}`.toLowerCase().includes(q))
    .map(u=>({...u,verificationUrl:u.odlonlineStatus==="VERIFY_LIVE"?UGC_DEB_DIRECTORY.url:UGC_DEB_DIRECTORY.url}));
}
