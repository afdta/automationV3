library(tidyverse)
library(readxl)
library(jsonlite)
library(metromonitor)

mm100 <- read_xlsx("/home/alec/Projects/Brookings/metro-monitor/build/data/indicators/2018 Metro Monitor Data - Wide (IS 2017.12.05).xlsx", sheet=1, range="A9:B108", col_names = c("code","title"))
metros <- metropops() %>% mutate(code=as.numeric(CBSA_Code)) %>% select(code, title=CBSA_Title) %>% mutate(package=1)

tst <- full_join(mm100, metros)

file <- "/home/alec/Projects/Brookings/automation/build/data/automation_workbook4.xlsx"

occs0 <- read_xlsx(file, sheet="occ_usa")
#major_occs0 <- read_xlsx(file, sheet="")

soc2 <- occs0 %>% mutate(name=sub("\\s*Occupations\\s*", "", soc2_name)) %>% select(name, soc2_code) %>% 
          as.data.frame() %>% unique() %>% spread(soc2_code, name) %>% unbox()

occs1 <- occs0 %>% select(occ=soc_desc, occ2=soc2_code, auto=automation_potential)

cbsa <- read_xlsx(file, sheet="cbsa") %>% select(geo=cbsa_code, name=cbsa_name, 
                                                 e00=emsi_emp_auto_2000, e16=emsi_emp_auto_2016, e26=emsi_emp_auto_2026,
                                                 sh00=share_auto_2000, sh16=share_auto_2016, sh26=share_auto_2026) %>% 
                                                filter(geo %in% metros$code)

state <- read_xlsx(file, sheet="state" ) %>% select(state_code, name=state_name, 
                                                    e00=emsi_emp_auto_2000, e16=emsi_emp_auto_2016, e26=emsi_emp_auto_2026,
                                                    sh00=share_auto_2000, sh16=share_auto_2016, sh26=share_auto_2026) %>%
                                                  mutate(geo = state_code/1000)

which(duplicated(occs1$occ))

medians <- occs1 %>% group_by(occ2) %>% summarise(auto=median(auto))

json <- toJSON(occs1, digits=5, na="null", pretty=TRUE)
jsonDict <- toJSON(soc2, na="null", pretty=TRUE)
jsonMedian <- toJSON(medians, na="null", digits=5, pretty=TRUE)
jsonCBSA <- toJSON(cbsa, na="null", digits=5, pretty=TRUE)
jsonState <- toJSON(state, na="null", digits=5, pretty=TRUE)

writeLines(c("var occs = ", json, ";", 
             "var occ_names = ", jsonDict, ";", 
             "var occ_medians = ", jsonMedian, ";",
             "var occ_cbsa = ", jsonCBSA, ";", 
             "var occ_state = ", jsonState, ";",
             "export {occs, occ_names, occ_medians, occ_cbsa, occ_state};"), 
           "/home/alec/Projects/Brookings/automation/build/js/raw-data.js")
