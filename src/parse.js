/**
 * @file: This file instantiates and parses a list of BYU Department codes, and exports it as a global variable.
 */

let string = `
Accounting\tACC
Aerospace Studies\tAEROS
Afrikaans\tAFRIK
Akan\tAKAN
Albanian\tALBAN
American Heritage\tA HTG
American Sign Language\tASL
American Studies\tAM ST
Ancient Near Eastern Studies\tANES
Anthropology\tANTHR
Applied English Linguistics\tELING
Arabic\tARAB
Armenian\tARMEN
Art\tART
Art Education\tARTED
Art History and Curatorial Studies\tARTHC
Asian Studies\tASIAN
Aymara\tAYMRA
Basque\tBASQ
Bicolano\tBCLNO
Biology\tBIO
Bulgarian\tBULGN
Burmese\tBURMS
Business Administration\tMBA
Cakchiquel\tCAKCQ
Cantonese\tCANT
Catalan\tCATLN
Cebuano\tCEBU
Cell Biology and Physiology\tCELL
Chemical Engineering\tCH EN
Chemistry and Biochemistry\tCHEM
Chinese - Mandarin\tCHIN
Civil and Construction Engineering\tCCE
Civil Engineering\tCE
Classical Civilization\tCL CV
Classics\tCLSCS
Communication Disorders\tCOMD
Communications\tCOMMS
Comparative Literature\tCMLIT
Computer Science\tC S
Computer Science Animation\tCSANM
Construction and Facilities Management\tCFM
Counseling Psychology and Special Education\tCPSE
Croatian\tCROAT
Czech\tCZECH
Dance\tDANCE
Danish\tDANSH
Dari\tDARI
Design\tDES
Design - Animation\tDESAN
Design - Graphic Design\tDESGD
Design - Illustration\tDESIL
Design - Photography\tDESPH
Digital Humanities and Technology\tDIGHT
Dutch\tDUTCH
Early Childhood Education\tECE
Economics\tECON
Educational Leadership and Foundations\tEDLF
Electrical and Computer Engineering\tEC EN
Elementary Education\tEL ED
Engineering Technology\tENG T
English\tENGL
English as a Second Language\tESL
Entrepreneurial Management\tENT
Estonian\tESTON
European Studies\tEUROP
Executive Master of Business Administration\tEMBA
Exercise Sciences\tEXSC
Experience Design and Management\tEXDM
Family, Home, and Social Sciences\tFHSS
Fijian\tFIJI
Finance\tFIN
Fine Arts\tFNART
Finnish\tFINN
Foreign Language Courses\tFLANG
French\tFREN
Ga\tGA
Geography\tGEOG
Geological Sciences\tGEOL
Georgian\tGEORG
German\tGERM
Global Supply Chain Management\tGSCM
Global Women's Studies\tGWS
Greek (Classical)\tGREEK
Greek, Modern\tM GRK
Guarani\tGUARA
Haitian Creole\tCREOL
Hawaiian\tHAWAI
Hebrew\tHEB
Hindi\tHINDI
History\tHIST
Hmong\tHMONG
Honors Program\tHONRS
Human Resource Management\tHRM
Humanities College\tHCOLL
Hungarian\tHUNG
Icelandic\tICLND
Ilangot\tILANG
Ilocano\tILOCN
Ilonggo/Hiligaynon\tHILIG
Indonesian\tINDON
Industrial Design\tINDES
Information Systems\tIS
Information Technology and Cybersecurity\tIT&C
Instructional Psychology and Technology\tIP&T
Interdisciplinary Humanities\tIHUM
International and Area Studies\tIAS
International Cinema Studies\tICS
International Relations\tIR
Italian\tITAL
Japanese\tJAPAN
Javanese\tJAVNS
K'iche\tKICHE
Kazakh\tKAZAK
Kekchi\tKEKCH
khmer\tKHMER
Kiribati\tKIRIB
Korean\tKOREA
Laotian\tLAO
Latin (Classical)\tLATIN
Latin American Studies\tLT AM
Latvian\tLATVI
Law\tLAW
Life Sciences\tLFSCI
Linguistics\tLING
Linguistics Computing\tLINGC
Lithuanian\tLITHU
Malagasy\tMALAG
Malay\tMALAY
Management Communication\tM COM
Manufacturing Engineering\tMFGEN
Maori\tMAORI
Marketing\tMKTG
Marriage and Family Therapy\tMFT
Marriage, Family, and Human Development\tMFHD
Marriott School of Business\tMSB
Marshallese\tMARSH
Mathematics\tMATH
Mathematics Education\tMTHED
Maya, Yucatec\tMAYA
Mechanical Engineering\tME EN
Microbiology and Molecular Biology\tMMBIO
Middle East Studies/Arabic\tMESA
Military Science\tMIL S
Mongolian\tMONGO
Music\tMUSIC
Music Dance Theatre\tMDT
Navajo\tNAVAJ
Near Eastern Languages\tNE LG
Near Eastern Studies\tNES
Neuroscience\tNEURO
Niuean\tNIUEA
Norwegian\tNORWE
Nursing\tNURS
Nutrition, Dietetics, and Food Science\tNDFS
Pashto\tPSHTO
Persian\tPERSI
Philosophy\tPHIL
Physical Education Teacher Education\tPETE
Physical Science\tPHY S
Physics and Astronomy\tPHSCS
Plant and Wildlife Sciences\tPWS
Polish\tPOLSH
Political Science\tPOLI
Portuguese\tPORT
Professional Language\tPLANG
Psychology\tPSYCH
Public Health\tHLTH
Public Management\tMPA
Public Policy\tP POL
Quechua\tQUECH
Rarotongan\tRAROT
Rel A - Ancient Scripture\tREL A
Rel C - Church History and Doctrine\tREL C
Rel E - Religious Education\tREL E
Romanian\tROM
Russian\tRUSS
Samoan\tSAMOA
Scandinavian Studies\tSCAND
School of Family Life\tSFL
Second Language Teaching\tSLAT
Secondary Education\tSC ED
Serbian\tSRBIA
Slovak\tSLOVK
Slovene\tSLN
Social Work\tSOC W
Sociology\tSOC
Spanish\tSPAN
Statistics\tSTAT
Strategic Management\tSTRAT
Student Activities\tSTAC
Student Development\tSTDEV
Student Wellness\tSWELL
Swahili\tSWAHI
Swedish\tSWED
Tagalog\tTAGAL
Tahitian\tTAHIT
Taiwanese\tTAIWN
Tamil\tTAMIL
Teacher Education\tT ED
Teaching English Language Learners\tTELL
Technology\tTECH
Technology and Engineering Education\tTEE
Technology and Engineering Studies\tTES
Thai\tTHAI
Theatre and Media Arts\tTMA
Therapeutic Recreation and Management\tTRM
Tibetan\tTIBET
Tongan\tTONGA
Trukese\tTRUKS
Turkish\tTURK
Twi\tTWI
Ukrainian\tUKRAI
University Requirements\tUNIV
Urdu\tURDU
Vanuatu\tVANTU
Vietnamese\tVIET
Waray-Waray\tWARAY
Welsh\tWELSH
Writing\tWRTG
Xhosa\tXHOSA`

string = string.split('\t')
string.splice(0, 1)

const begList = (string.map((item) => {
  item = item.split('\n')[0]
  return item
}))
begList.unshift('< Go back')
export const listOfDepartments = begList
