'use client';

import { useMemo, useState } from 'react';

type Service = { id: string; category: string; name: string; price: number; mode: string; note: string };

const services: Service[] = [
  {id:'DOC-001',category:'पहचान व नागरिक दस्तावेज',name:'PAN कार्ड आवेदन सहायता',price:149,mode:'ऑनलाइन',note:'सरकारी/थर्ड-पार्टी शुल्क अलग हो सकता है'},
  {id:'DOC-002',category:'पहचान व नागरिक दस्तावेज',name:'PAN कार्ड सुधार सहायता',price:199,mode:'ऑनलाइन',note:'फॉर्म व दस्तावेज जाँच'},
  {id:'DOC-003',category:'पहचान व नागरिक दस्तावेज',name:'PAN कार्ड डाउनलोड सहायता',price:99,mode:'ऑनलाइन',note:'उपलब्ध अधिकृत माध्यम से'},
  {id:'DOC-004',category:'पहचान व नागरिक दस्तावेज',name:'Voter ID आवेदन सहायता',price:149,mode:'ऑनलाइन',note:'निर्णय संबंधित विभाग का'},
  {id:'DOC-005',category:'पहचान व नागरिक दस्तावेज',name:'Voter ID सुधार सहायता',price:199,mode:'ऑनलाइन',note:'योग्यता व पोर्टल उपलब्धता लागू'},
  {id:'DOC-006',category:'पहचान व नागरिक दस्तावेज',name:'जन्म प्रमाणपत्र आवेदन सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य/नगर निकाय के अनुसार'},
  {id:'DOC-007',category:'पहचान व नागरिक दस्तावेज',name:'मृत्यु प्रमाणपत्र आवेदन सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य/नगर निकाय के अनुसार'},
  {id:'DOC-008',category:'पहचान व नागरिक दस्तावेज',name:'जाति प्रमाणपत्र आवेदन सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'स्थानीय पात्रता नियम लागू'},
  {id:'DOC-009',category:'पहचान व नागरिक दस्तावेज',name:'आय प्रमाणपत्र आवेदन सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'स्थानीय पात्रता नियम लागू'},
  {id:'DOC-010',category:'पहचान व नागरिक दस्तावेज',name:'मूल निवास प्रमाणपत्र सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य पोर्टल के अनुसार'},
  {id:'DOC-011',category:'पहचान व नागरिक दस्तावेज',name:'EWS प्रमाणपत्र सहायता',price:249,mode:'ऑनलाइन/ऑफलाइन',note:'पात्रता जाँच जरूरी'},
  {id:'DOC-012',category:'पहचान व नागरिक दस्तावेज',name:'चरित्र प्रमाणपत्र सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'विभागीय प्रक्रिया लागू'},
  {id:'DOC-013',category:'पहचान व नागरिक दस्तावेज',name:'राशन कार्ड आवेदन सहायता',price:249,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य के नियम लागू'},
  {id:'DOC-014',category:'पहचान व नागरिक दस्तावेज',name:'राशन कार्ड में सदस्य जोड़ने की सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य के नियम लागू'},
  {id:'DOC-015',category:'पहचान व नागरिक दस्तावेज',name:'राशन कार्ड सुधार सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य के नियम लागू'},
  {id:'DOC-016',category:'पहचान व नागरिक दस्तावेज',name:'जन आधार/परिवार पहचान सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य के अनुसार उपलब्धता'},
  {id:'DOC-017',category:'पहचान व नागरिक दस्तावेज',name:'आयुष्मान कार्ड सहायता',price:149,mode:'ऑनलाइन',note:'पात्रता व अधिकृत प्रक्रिया लागू'},
  {id:'DOC-018',category:'पहचान व नागरिक दस्तावेज',name:'सरकारी दस्तावेज डाउनलोड सहायता',price:99,mode:'ऑनलाइन',note:'जहाँ वैध रूप से उपलब्ध हो'},
  {id:'DOC-019',category:'पहचान व नागरिक दस्तावेज',name:'दस्तावेज स्कैन/अपलोड सहायता',price:79,mode:'ऑनलाइन',note:'प्रति आवेदन/सेट'},
  {id:'DOC-020',category:'पहचान व नागरिक दस्तावेज',name:'दस्तावेज चेकलिस्ट व फाइल तैयारी',price:149,mode:'ऑनलाइन/ऑफलाइन',note:'सलाह/सहायता शुल्क'},
  {id:'EDU-021',category:'शिक्षा व स्कॉलरशिप',name:'स्कॉलरशिप फॉर्म सहायता',price:149,mode:'ऑनलाइन',note:'स्वीकृति की गारंटी नहीं'},
  {id:'EDU-022',category:'शिक्षा व स्कॉलरशिप',name:'NSP आवेदन सहायता',price:199,mode:'ऑनलाइन',note:'पात्रता व संस्था सत्यापन लागू'},
  {id:'EDU-023',category:'शिक्षा व स्कॉलरशिप',name:'कॉलेज एडमिशन फॉर्म',price:149,mode:'ऑनलाइन',note:'कॉलेज शुल्क अलग'},
  {id:'EDU-024',category:'शिक्षा व स्कॉलरशिप',name:'यूनिवर्सिटी आवेदन सहायता',price:199,mode:'ऑनलाइन',note:'आवेदन शुल्क अलग'},
  {id:'EDU-025',category:'शिक्षा व स्कॉलरशिप',name:'परीक्षा फॉर्म सहायता',price:99,mode:'ऑनलाइन',note:'परीक्षा शुल्क अलग'},
  {id:'EDU-026',category:'शिक्षा व स्कॉलरशिप',name:'एडमिट कार्ड डाउनलोड',price:49,mode:'ऑनलाइन',note:'जहाँ उपलब्ध हो'},
  {id:'EDU-027',category:'शिक्षा व स्कॉलरशिप',name:'रिजल्ट डाउनलोड/प्रिंट तैयारी',price:29,mode:'ऑनलाइन',note:'प्रिंट शुल्क अलग हो सकता है'},
  {id:'EDU-028',category:'शिक्षा व स्कॉलरशिप',name:'सरकारी नौकरी आवेदन सहायता',price:149,mode:'ऑनलाइन',note:'आवेदन शुल्क अलग'},
  {id:'EDU-029',category:'शिक्षा व स्कॉलरशिप',name:'रोजगार पंजीकरण सहायता',price:99,mode:'ऑनलाइन',note:'राज्य पोर्टल के अनुसार'},
  {id:'EDU-030',category:'शिक्षा व स्कॉलरशिप',name:'ITI/पॉलिटेक्निक आवेदन',price:149,mode:'ऑनलाइन',note:'आवेदन शुल्क अलग'},
  {id:'EDU-031',category:'शिक्षा व स्कॉलरशिप',name:'स्कॉलरशिप दस्तावेज जाँच',price:99,mode:'ऑनलाइन',note:'स्वीकृति की गारंटी नहीं'},
  {id:'EDU-032',category:'शिक्षा व स्कॉलरशिप',name:'रिज्यूमे/CV बनाना',price:199,mode:'ऑनलाइन',note:'एक भाषा व एक संस्करण'},
  {id:'EDU-033',category:'शिक्षा व स्कॉलरशिप',name:'ऑनलाइन जॉब प्रोफाइल सेटअप',price:149,mode:'ऑनलाइन',note:'ग्राहक की सहमति जरूरी'},
  {id:'EDU-034',category:'शिक्षा व स्कॉलरशिप',name:'प्रवेश/काउंसलिंग फॉर्म सहायता',price:249,mode:'ऑनलाइन',note:'संस्थान शुल्क अलग'},
  {id:'EDU-035',category:'शिक्षा व स्कॉलरशिप',name:'ऑनलाइन कोर्स रजिस्ट्रेशन सहायता',price:99,mode:'ऑनलाइन',note:'कोर्स फीस अलग'},
  {id:'BIZ-036',category:'GST व बिजनेस',name:'GST रजिस्ट्रेशन दस्तावेज जाँच',price:299,mode:'ऑनलाइन',note:'GST सरकारी आवेदन शुल्क और YCM शुल्क अलग दिखाएँ'},
  {id:'BIZ-037',category:'GST व बिजनेस',name:'GST रजिस्ट्रेशन सहायता',price:499,mode:'ऑनलाइन',note:'योग्य पेशेवर/अधिकृत प्रक्रिया जहाँ जरूरी'},
  {id:'BIZ-038',category:'GST व बिजनेस',name:'GST Nil Return सहायता',price:299,mode:'ऑनलाइन',note:'रिटर्न अवधि व पात्रता जाँचें'},
  {id:'BIZ-039',category:'GST व बिजनेस',name:'नियमित GST रिटर्न सहायता',price:499,mode:'ऑनलाइन',note:'जटिलता/ट्रांजैक्शन के अनुसार'},
  {id:'BIZ-040',category:'GST व बिजनेस',name:'Udyam/MSME रजिस्ट्रेशन सहायता',price:299,mode:'ऑनलाइन',note:'सरकारी पोर्टल पर पंजीकरण सामान्यतः निःशुल्क; YCM शुल्क अलग'},
  {id:'BIZ-041',category:'GST व बिजनेस',name:'दुकान एवं प्रतिष्ठान रजिस्ट्रेशन सहायता',price:499,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य शुल्क अलग'},
  {id:'BIZ-042',category:'GST व बिजनेस',name:'FSSAI रजिस्ट्रेशन सहायता',price:499,mode:'ऑनलाइन',note:'सरकारी शुल्क अलग'},
  {id:'BIZ-043',category:'GST व बिजनेस',name:'ट्रेड लाइसेंस आवेदन सहायता',price:499,mode:'ऑनलाइन/ऑफलाइन',note:'स्थानीय निकाय शुल्क अलग'},
  {id:'BIZ-044',category:'GST व बिजनेस',name:'Import Export Code सहायता',price:799,mode:'ऑनलाइन',note:'सरकारी/DSC शुल्क अलग'},
  {id:'BIZ-045',category:'GST व बिजनेस',name:'डिजिटल सिग्नेचर आवेदन सहायता',price:499,mode:'ऑनलाइन',note:'सर्टिफिकेट/टोकन लागत अलग'},
  {id:'BIZ-046',category:'GST व बिजनेस',name:'ITR-1 फाइलिंग सहायता',price:499,mode:'ऑनलाइन',note:'योग्य करदाता और अधिकृत प्रोसेसिंग'},
  {id:'BIZ-047',category:'GST व बिजनेस',name:'बिजनेस ITR सहायता',price:999,mode:'ऑनलाइन',note:'CA/योग्य पेशेवर शुल्क अलग हो सकता है'},
  {id:'BIZ-048',category:'GST व बिजनेस',name:'TDS रिटर्न सहायता',price:499,mode:'ऑनलाइन',note:'फॉर्म/क्वार्टर के अनुसार'},
  {id:'BIZ-049',category:'GST व बिजनेस',name:'प्रोजेक्ट रिपोर्ट',price:1499,mode:'ऑनलाइन',note:'वित्तीय विवरण की गुणवत्ता पर निर्भर'},
  {id:'BIZ-050',category:'GST व बिजनेस',name:'CMA डेटा/लोन प्रोजेक्शन',price:2999,mode:'ऑनलाइन',note:'योग्य पेशेवर की समीक्षा जहाँ जरूरी'},
  {id:'BIZ-051',category:'GST व बिजनेस',name:'पार्टनरशिप डीड ड्राफ्ट सहायता',price:999,mode:'ऑनलाइन',note:'स्टाम्प/वकील शुल्क अलग'},
  {id:'BIZ-052',category:'GST व बिजनेस',name:'कंपनी रजिस्ट्रेशन सहायता पैकेज',price:4999,mode:'ऑनलाइन',note:'सरकारी फीस, DSC, स्टाम्प और पेशेवर फीस अलग'},
  {id:'BIZ-053',category:'GST व बिजनेस',name:'बिजनेस नाम/दस्तावेज चेकलिस्ट',price:199,mode:'ऑनलाइन',note:'नाम उपलब्धता की गारंटी नहीं'},
  {id:'BIZ-054',category:'GST व बिजनेस',name:'इनवॉइस/बिल टेम्पलेट सेटअप',price:299,mode:'ऑनलाइन',note:'कस्टम काम पर अलग कीमत'},
  {id:'BIZ-055',category:'GST व बिजनेस',name:'ई-वे बिल सहायता',price:99,mode:'ऑनलाइन',note:'प्रति बिल; पात्रता/नियम लागू'},
  {id:'FIN-056',category:'लोन व वित्त',name:'पर्सनल लोन पात्रता जानकारी',price:99,mode:'ऑनलाइन',note:'स्वीकृति की गारंटी नहीं'},
  {id:'FIN-057',category:'लोन व वित्त',name:'बिजनेस लोन दस्तावेज जाँच',price:299,mode:'ऑनलाइन',note:'लेंडर/DSA नियम लागू'},
  {id:'FIN-058',category:'लोन व वित्त',name:'होम लोन दस्तावेज सहायता',price:499,mode:'ऑनलाइन',note:'बैंक/लेंडर शुल्क अलग'},
  {id:'FIN-059',category:'लोन व वित्त',name:'मुद्रा लोन आवेदन सहायता',price:499,mode:'ऑनलाइन',note:'स्वीकृति की गारंटी नहीं'},
  {id:'FIN-060',category:'लोन व वित्त',name:'वाहन लोन दस्तावेज सहायता',price:199,mode:'ऑनलाइन',note:'लेंडर शुल्क अलग'},
  {id:'FIN-061',category:'लोन व वित्त',name:'लोन प्रोजेक्ट रिपोर्ट',price:1499,mode:'ऑनलाइन',note:'लोन स्वीकृति की गारंटी नहीं'},
  {id:'FIN-062',category:'लोन व वित्त',name:'KCC आवेदन दस्तावेज सहायता',price:299,mode:'ऑनलाइन/ऑफलाइन',note:'बैंक/योजना पात्रता लागू'},
  {id:'FIN-063',category:'लोन व वित्त',name:'PM-KISAN स्टेटस/दस्तावेज सहायता',price:99,mode:'ऑनलाइन',note:'लाभार्थी पात्रता/सरकारी प्रक्रिया लागू'},
  {id:'FIN-064',category:'लोन व वित्त',name:'फसल बीमा जानकारी/आवेदन सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'प्रीमियम व पॉलिसी शर्तें अलग'},
  {id:'FIN-065',category:'लोन व वित्त',name:'इंश्योरेंस पॉलिसी समझाने की सेवा',price:99,mode:'ऑनलाइन',note:'बिक्री/सलाह नियामकीय अनुमति के अनुसार'},
  {id:'FIN-066',category:'लोन व वित्त',name:'इंश्योरेंस तुलना/लीड रेफरल',price:0,mode:'ऑनलाइन',note:'रेफरल कमीशन केवल वैध लिखित व्यवस्था के अनुसार'},
  {id:'FIN-067',category:'लोन व वित्त',name:'बैंकिंग उत्पाद रेफरल सहायता',price:0,mode:'ऑनलाइन',note:'अधिकृत पार्टनर नियम लागू'},
  {id:'FIN-068',category:'लोन व वित्त',name:'क्रेडिट रिपोर्ट समझने की सहायता',price:199,mode:'ऑनलाइन',note:'ग्राहक की सहमति; स्कोर बढ़ने की गारंटी नहीं'},
  {id:'FIN-069',category:'लोन व वित्त',name:'लोन आवेदन स्थिति सहायता',price:99,mode:'ऑनलाइन',note:'लेंडर की उपलब्ध जानकारी पर निर्भर'},
  {id:'FIN-070',category:'लोन व वित्त',name:'वित्तीय दस्तावेज फाइल तैयारी',price:299,mode:'ऑनलाइन',note:'लेंडर के चेकलिस्ट के अनुसार'},
  {id:'DIG-071',category:'डिजिटल सहायता',name:'सामान्य ऑनलाइन फॉर्म भरना',price:99,mode:'ऑनलाइन',note:'सरकारी आवेदन शुल्क अलग'},
  {id:'DIG-072',category:'डिजिटल सहायता',name:'PDF मर्ज/कंप्रेस सहायता',price:49,mode:'ऑनलाइन',note:'प्रति फाइल सेट'},
  {id:'DIG-073',category:'डिजिटल सहायता',name:'दस्तावेज टाइपिंग',price:99,mode:'ऑनलाइन',note:'लंबाई/भाषा के अनुसार'},
  {id:'DIG-074',category:'डिजिटल सहायता',name:'फोटो/सिग्नेचर फाइल तैयारी',price:49,mode:'ऑनलाइन',note:'पोर्टल के विनिर्देश के अनुसार'},
  {id:'DIG-075',category:'डिजिटल सहायता',name:'ऑनलाइन अपॉइंटमेंट सहायता',price:99,mode:'ऑनलाइन',note:'अपॉइंटमेंट उपलब्धता की गारंटी नहीं'},
  {id:'DIG-076',category:'डिजिटल सहायता',name:'आवेदन स्टेटस जाँच',price:49,mode:'ऑनलाइन',note:'जहाँ वैध रूप से उपलब्ध हो'},
  {id:'DIG-077',category:'डिजिटल सहायता',name:'आवेदन त्रुटि/रिजेक्शन चेक',price:99,mode:'ऑनलाइन',note:'विभागीय निर्णय पर नियंत्रण नहीं'},
  {id:'DIG-078',category:'डिजिटल सहायता',name:'डिजिटल फाइल व्यवस्थित करना',price:149,mode:'ऑनलाइन',note:'ग्राहक की अनुमति से'},
  {id:'DIG-079',category:'डिजिटल सहायता',name:'WhatsApp पर आवेदन अपडेट',price:0,mode:'ऑनलाइन',note:'सर्विस पैकेज/सहमति के अनुसार'},
  {id:'DIG-080',category:'डिजिटल सहायता',name:'प्रिंटिंग/स्कैनिंग प्रति सेट',price:49,mode:'ऑफलाइन',note:'पेज संख्या के अनुसार कीमत बदल सकती है'},
  {id:'AGR-081',category:'किसान व सरकारी योजनाएँ',name:'किसान योजना पात्रता जानकारी',price:0,mode:'ऑनलाइन',note:'जानकारी निःशुल्क भी उपलब्ध हो सकती है'},
  {id:'AGR-082',category:'किसान व सरकारी योजनाएँ',name:'किसान योजना आवेदन दस्तावेज सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'पात्रता और योजना नियम लागू'},
  {id:'AGR-083',category:'किसान व सरकारी योजनाएँ',name:'PM-KUSUM आवेदन सहायता',price:299,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य/योजना विंडो लागू'},
  {id:'AGR-084',category:'किसान व सरकारी योजनाएँ',name:'फसल बीमा दस्तावेज सहायता',price:199,mode:'ऑनलाइन/ऑफलाइन',note:'बीमा कंपनी/योजना नियम लागू'},
  {id:'AGR-085',category:'किसान व सरकारी योजनाएँ',name:'किसान पंजीकरण सहायता',price:149,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य पोर्टल के अनुसार'},
  {id:'AGR-086',category:'किसान व सरकारी योजनाएँ',name:'FPO दस्तावेज/प्रोजेक्ट सहायता',price:1999,mode:'ऑनलाइन',note:'कानूनी/CA/CS शुल्क अलग'},
  {id:'AGR-087',category:'किसान व सरकारी योजनाएँ',name:'डेयरी/पशुपालन प्रोजेक्ट रिपोर्ट',price:1499,mode:'ऑनलाइन',note:'बैंक/पेशेवर समीक्षा आवश्यक हो सकती है'},
  {id:'AGR-088',category:'किसान व सरकारी योजनाएँ',name:'पशुपालन योजना आवेदन सहायता',price:299,mode:'ऑनलाइन/ऑफलाइन',note:'राज्य/योजना पात्रता लागू'},
  {id:'AGR-089',category:'किसान व सरकारी योजनाएँ',name:'सरकारी योजना दस्तावेज चेकलिस्ट',price:99,mode:'ऑनलाइन',note:'सेवा/राज्य के अनुसार'},
  {id:'AGR-090',category:'किसान व सरकारी योजनाएँ',name:'योजना आवेदन स्थिति सहायता',price:49,mode:'ऑनलाइन',note:'विभागीय पोर्टल पर निर्भर'},
  {id:'SUP-091',category:'सपोर्ट व अन्य',name:'मानव Mitra कस्टमर सपोर्ट सत्र',price:99,mode:'फोन/ऑनलाइन',note:'समय/पैकेज के अनुसार'},
  {id:'SUP-092',category:'सपोर्ट व अन्य',name:'परिवार 360 सदस्यता (प्रस्तावित)',price:99,mode:'ऑनलाइन',note:'सदस्यता अवधि व शर्तें प्रकाशित करें'},
  {id:'SUP-093',category:'सपोर्ट व अन्य',name:'डोरस्टेप दस्तावेज पिकअप समन्वय',price:149,mode:'ऑफलाइन',note:'यात्रा/कूरियर शुल्क अलग'},
  {id:'SUP-094',category:'सपोर्ट व अन्य',name:'कूरियर/डिलीवरी समन्वय',price:99,mode:'ऑनलाइन',note:'कूरियर शुल्क अलग'},
  {id:'SUP-095',category:'सपोर्ट व अन्य',name:'शिकायत/ग्रिवांस आवेदन सहायता',price:199,mode:'ऑनलाइन',note:'कानूनी प्रतिनिधित्व शामिल नहीं'},
  {id:'SUP-096',category:'सपोर्ट व अन्य',name:'RTI आवेदन ड्राफ्ट सहायता',price:299,mode:'ऑनलाइन',note:'RTI सरकारी शुल्क अलग; कानूनी सलाह नहीं'},
  {id:'SUP-097',category:'सपोर्ट व अन्य',name:'उपभोक्ता शिकायत फॉर्म सहायता',price:299,mode:'ऑनलाइन',note:'पेशेवर/कोर्ट फीस अलग'},
  {id:'SUP-098',category:'सपोर्ट व अन्य',name:'पासपोर्ट आवेदन फॉर्म सहायता',price:299,mode:'ऑनलाइन',note:'Passport Seva शुल्क अलग; नियुक्ति/स्वीकृति की गारंटी नहीं'},
  {id:'SUP-099',category:'सपोर्ट व अन्य',name:'विदेशी वीजा दस्तावेज चेकलिस्ट',price:499,mode:'ऑनलाइन',note:'दूतावास/वीजा फीस अलग; स्वीकृति की गारंटी नहीं'},
  {id:'SUP-100',category:'सपोर्ट व अन्य',name:'कस्टम दस्तावेज/एप्लिकेशन सहायता',price:299,mode:'ऑनलाइन',note:'काम शुरू करने से पहले लिखित कोटेशन'},
];

const initialCosts = [
  {label:'ऑपरेशन मैनेजर वेतन',value:25000},
  {label:'कस्टमर सपोर्ट (2 कर्मचारी)',value:30000},
  {label:'डॉक्यूमेंट प्रोसेसिंग (2 कर्मचारी)',value:30000},
  {label:'टेलीसेल्स (2 कर्मचारी)',value:28000},
  {label:'डिजिटल मार्केटिंग वेतन',value:20000},
  {label:'ऑफिस किराया',value:18000},
  {label:'बिजली व इंटरनेट',value:5000},
  {label:'फोन व कॉलिंग',value:8000},
  {label:'मार्केटिंग बजट',value:20000},
  {label:'सॉफ्टवेयर व सर्वर',value:10000},
  {label:'प्रिंटिंग व स्टेशनरी',value:3000},
  {label:'अकाउंटिंग व अनुपालन',value:5000},
  {label:'अन्य खर्च',value:8000},
];

const money = (n: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);

export default function ServiceRatesPage() {
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('सभी श्रेणियाँ');
  const [tab,setTab] = useState<'rates'|'calculator'>('rates');
  const [price,setPrice] = useState(300);
  const [ordersPerDay,setOrdersPerDay] = useState(50);
  const [workDays,setWorkDays] = useState(26);
  const [gstRate,setGstRate] = useState(18);
  const [priceIncludesGst,setPriceIncludesGst] = useState(true);
  const [variableCost,setVariableCost] = useState(50);
  const [targetMargin,setTargetMargin] = useState(15);
  const [callsPerAgent,setCallsPerAgent] = useState(100);
  const [agents,setAgents] = useState(2);
  const [connectRate,setConnectRate] = useState(25);
  const [leadRate,setLeadRate] = useState(30);
  const [closeRate,setCloseRate] = useState(25);
  const [costs,setCosts] = useState(initialCosts);
  const [showCostEditor,setShowCostEditor] = useState(false);

  const categories = useMemo(()=>['सभी श्रेणियाँ',...Array.from(new Set(services.map(s=>s.category)))],[ ]);
  const filtered = useMemo(()=>{
    const q=query.trim().toLowerCase();
    return services.filter(s=>(category==='सभी श्रेणियाँ'||s.category===category)&&(!q||`${s.id} ${s.name} ${s.category} ${s.note}`.toLowerCase().includes(q)));
  },[query,category]);

  const fixedCosts = costs.reduce((sum,c)=>sum+Math.max(0,c.value),0);
  const grossMonthly = Math.max(0,price)*Math.max(0,ordersPerDay)*Math.max(0,workDays);
  const netPerOrder = priceIncludesGst ? price/(1+Math.max(0,gstRate)/100) : price;
  const gstPerOrder = priceIncludesGst ? price-netPerOrder : price*Math.max(0,gstRate)/100;
  const revenueNet = netPerOrder*Math.max(0,ordersPerDay)*Math.max(0,workDays);
  const variableMonthly = Math.max(0,variableCost)*Math.max(0,ordersPerDay)*Math.max(0,workDays);
  const contribution = (netPerOrder-Math.max(0,variableCost))*Math.max(0,ordersPerDay)*Math.max(0,workDays);
  const operatingProfit = contribution-fixedCosts;
  const margin = revenueNet>0 ? operatingProfit/revenueNet*100 : 0;
  const targetPerOrder = netPerOrder*(Math.max(0,targetMargin)/100);
  const orderContributionForTarget = netPerOrder-Math.max(0,variableCost)-targetPerOrder;
  const requiredMonthlyOrders = orderContributionForTarget>0 ? Math.ceil(fixedCosts/orderContributionForTarget) : Infinity;
  const requiredDailyOrders = Number.isFinite(requiredMonthlyOrders)&&workDays>0 ? Math.ceil(requiredMonthlyOrders/workDays) : Infinity;
  const dailyCalls = Math.max(0,agents)*Math.max(0,callsPerAgent);
  const expectedDailyOrders = dailyCalls*(Math.max(0,connectRate)/100)*(Math.max(0,leadRate)/100)*(Math.max(0,closeRate)/100);
  const estimatedOrders = Math.round(expectedDailyOrders*100)/100;

  function exportCsv(){
    const rows=[['Service ID','Category','Service','Proposed YCM fee INR','Mode','Notes'],...services.map(s=>[s.id,s.category,s.name,String(s.price),s.mode,s.note])];
    const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='YCM_100_Service_Rate_List.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-gradient-to-r from-blue-950 via-blue-800 to-cyan-700 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="text-sm font-bold uppercase tracking-[.2em] text-cyan-200">YOJANA CONNECT MITRA PVT. LTD.</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">Service Rate List & Profit Planner</h1><p className="mt-3 max-w-3xl text-blue-100">100 सेवाओं की प्रस्तावित रेट लिस्ट, मासिक P&L कैलकुलेटर और कॉलिंग टारगेट — एक ही जगह।</p></div>
          <a href="/services" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">सर्विस कैटलॉग →</a>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={()=>setTab('rates')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab==='rates'?'bg-white text-blue-950':'bg-white/10 text-white hover:bg-white/20'}`}>100 सेवाओं की रेट लिस्ट</button>
          <button onClick={()=>setTab('calculator')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab==='calculator'?'bg-white text-blue-950':'bg-white/10 text-white hover:bg-white/20'}`}>Profit & Calling Calculator</button>
        </div>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">रेट लिस्ट में सेवाएँ</p><p className="mt-1 text-3xl font-black">100</p></div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">प्रस्तावित औसत बिल</p><p className="mt-1 text-3xl font-black">{money(300)}</p></div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">प्रस्तावित मासिक स्थायी खर्च</p><p className="mt-1 text-3xl font-black">{money(fixedCosts)}</p></div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">लक्षित ऑपरेटिंग मार्जिन</p><p className="mt-1 text-3xl font-black">{targetMargin}%</p></div>
      </div>

      {tab==='rates' ? <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="सेवा का नाम, ID या श्रेणी खोजें..." className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600 md:flex-1"/>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border bg-white px-3 py-3">{categories.map(c=><option key={c}>{c}</option>)}</select>
          <button onClick={exportCsv} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800">CSV डाउनलोड ↓</button>
        </div>
        <div className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-950"><b>महत्वपूर्ण:</b> ये प्रस्तावित YCM सहायता शुल्क हैं, अंतिम प्रकाशित टैरिफ नहीं। सरकारी/विभागीय फीस, पोर्टल/पेशेवर शुल्क और लागू GST अलग दिखाएँ। सेवा उपलब्धता, राज्य के नियम और आवश्यक प्राधिकरण जाँचने के बाद ही दर प्रकाशित करें।</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Service ID</th><th className="px-4 py-3">श्रेणी / सेवा</th><th className="px-4 py-3">YCM प्रस्तावित शुल्क</th><th className="px-4 py-3">माध्यम</th><th className="px-4 py-3">नोट</th></tr></thead>
            <tbody className="divide-y">{filtered.map(s=><tr key={s.id} className="hover:bg-blue-50/50"><td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{s.id}</td><td className="px-4 py-3"><div className="font-bold">{s.name}</div><div className="mt-1 text-xs text-slate-500">{s.category}</div></td><td className="whitespace-nowrap px-4 py-3 font-black text-blue-800">{s.price===0?'निःशुल्क':money(s.price)}</td><td className="whitespace-nowrap px-4 py-3">{s.mode}</td><td className="min-w-64 px-4 py-3 text-xs text-slate-600">{s.note}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="border-t px-4 py-3 text-sm text-slate-500">दिखाई गई {filtered.length} सेवाएँ / कुल {services.length}। कीमतें प्रस्तावित हैं; प्रकाशित करने से पहले सेवा-वार समीक्षा और स्वीकृति आवश्यक है।</div>
      </div> : <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">मासिक Profit & Loss कैलकुलेटर</h2><p className="mt-1 text-sm text-slate-500">नीचे के आँकड़े बदलें; परिणाम तुरंत अपडेट होंगे। यह अनुमान है, अकाउंटिंग स्टेटमेंट नहीं।</p></div><button onClick={()=>setShowCostEditor(v=>!v)} className="rounded-xl border px-4 py-2 text-sm font-bold">{showCostEditor?'खर्च बंद करें':'खर्च एडिट करें'}</button></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold">औसत ग्राहक बिल (₹)<input type="number" min="0" value={price} onChange={e=>setPrice(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">भुगतान वाले आवेदन / दिन<input type="number" min="0" value={ordersPerDay} onChange={e=>setOrdersPerDay(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">काम के दिन / महीना<input type="number" min="1" max="31" value={workDays} onChange={e=>setWorkDays(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">GST दर (अनुमान %)<input type="number" min="0" max="100" value={gstRate} onChange={e=>setGstRate(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">प्रति आवेदन परिवर्तनीय खर्च (₹)<input type="number" min="0" value={variableCost} onChange={e=>setVariableCost(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">लक्षित ऑपरेटिंग प्रॉफिट (%)<input type="number" min="0" max="90" value={targetMargin} onChange={e=>setTargetMargin(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={priceIncludesGst} onChange={e=>setPriceIncludesGst(e.target.checked)} className="h-4 w-4"/> औसत ग्राहक बिल में GST शामिल है (अनुमान)</label>
          {showCostEditor&&<div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="mb-3 font-black">मासिक स्थायी खर्च एडिट करें</h3><div className="grid gap-3 md:grid-cols-2">{costs.map((c,i)=><label key={c.label} className="text-sm">{c.label}<input type="number" min="0" value={c.value} onChange={e=>setCosts(prev=>prev.map((item,j)=>j===i?{...item,value:Number(e.target.value)}:item))} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2"/></label>)}</div><p className="mt-3 text-xs text-slate-500">CEO वेतन, नियोक्ता अंशदान, रिफंड/खराब ऋण और अन्य छूटे खर्च हों तो उन्हें भी किसी उपयुक्त खर्च में जोड़ें।</p></div>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">मासिक सकल बिक्री</p><p className="mt-1 text-2xl font-black">{money(grossMonthly)}</p></div>
            <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">GST रहित अनुमानित राजस्व</p><p className="mt-1 text-2xl font-black">{money(revenueNet)}</p></div>
            <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">मासिक स्थायी खर्च</p><p className="mt-1 text-2xl font-black">{money(fixedCosts)}</p></div>
            <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">परिवर्तनीय खर्च</p><p className="mt-1 text-2xl font-black">{money(variableMonthly)}</p></div>
            <div className={`rounded-xl p-4 ${operatingProfit>=0?'bg-emerald-100 text-emerald-950':'bg-rose-100 text-rose-950'}`}><p className="text-sm opacity-75">अनुमानित ऑपरेटिंग प्रॉफिट</p><p className="mt-1 text-2xl font-black">{money(operatingProfit)}</p><p className="mt-1 text-sm">मार्जिन: {margin.toFixed(1)}%</p></div>
            <div className="rounded-xl bg-blue-100 p-4 text-blue-950"><p className="text-sm">लक्ष्य {targetMargin}% के लिए आवश्यक आवेदन</p><p className="mt-1 text-2xl font-black">{Number.isFinite(requiredDailyOrders)?requiredDailyOrders.toLocaleString('en-IN'):'संभव नहीं'} / दिन</p><p className="mt-1 text-xs">मासिक: {Number.isFinite(requiredMonthlyOrders)?requiredMonthlyOrders.toLocaleString('en-IN'):'—'}</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">यह सरल मॉडल GST को पास-थ्रू मानता है और इनपुट टैक्स क्रेडिट, आयकर, रिफंड, असफल आवेदन, बैड डेब्ट, सेवा-वार अलग GST दर और अन्य एकमुश्त खर्चों की गणना नहीं करता। वास्तविक वित्तीय निर्णय से पहले CA से जाँच कराएँ।</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">कॉलिंग और सेल्स कैलकुलेटर</h2><p className="mt-1 text-sm text-slate-500">कॉलिंग अनुमान तभी उपयोगी है जब संपर्क वैध हो और ग्राहक की सहमति/टेलीकॉम नियमों का पालन हो।</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold">टेलीसेल्स कर्मचारी<input type="number" min="0" value={agents} onChange={e=>setAgents(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">प्रति कर्मचारी डायल / दिन<input type="number" min="0" value={callsPerAgent} onChange={e=>setCallsPerAgent(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">कनेक्ट रेट (%)<input type="number" min="0" max="100" value={connectRate} onChange={e=>setConnectRate(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">कनेक्ट से योग्य लीड (%)<input type="number" min="0" max="100" value={leadRate} onChange={e=>setLeadRate(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
            <label className="text-sm font-semibold">योग्य लीड से बिक्री (%)<input type="number" min="0" max="100" value={closeRate} onChange={e=>setCloseRate(Number(e.target.value))} className="mt-1 block w-full rounded-xl border px-3 py-2"/></label>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">कुल डायल / दिन</p><p className="mt-1 text-2xl font-black">{dailyCalls.toLocaleString('en-IN')}</p></div>
            <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm text-slate-500">अनुमानित भुगतान आवेदन / दिन</p><p className="mt-1 text-2xl font-black">{estimatedOrders.toLocaleString('en-IN')}</p></div>
            <div className="rounded-xl bg-blue-100 p-4 text-blue-950"><p className="text-sm">सेल्स अनुमान से लक्ष्य का अंतर</p><p className="mt-1 text-2xl font-black">{Number.isFinite(requiredDailyOrders)?Math.max(0,Math.ceil(requiredDailyOrders-estimatedOrders)).toLocaleString('en-IN'):'—'} आवेदन/दिन</p></div>
          </div>
          <p className="mt-4 text-sm text-slate-600">सलाह: शुरुआती महीने में परिणाम रोज रिकॉर्ड करें। कॉल की संख्या से ज्यादा योग्य लीड, भुगतान वाले आवेदन, प्रति ग्राहक लागत, रिफंड और ग्राहक संतुष्टि देखें।</p>
        </div>
      </div>}
    </section>
    <footer className="border-t bg-white"><div className="mx-auto max-w-7xl px-4 py-6 text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">© {new Date().getFullYear()} Yojana Connect Mitra Pvt. Ltd. • सभी दरें प्रस्तावित हैं, अंतिम सार्वजनिक टैरिफ नहीं। सरकारी सेवाओं की पात्रता/स्वीकृति संबंधित विभाग के अधिकार में है। सरकारी शुल्क और YCM सहायता शुल्क अलग-अलग दिखाएँ। विनियमित सेवाएँ केवल लागू प्राधिकरण/पार्टनर नियमों के अनुसार।</div></footer>
  </main>;
}
