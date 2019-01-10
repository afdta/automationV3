library(tidyverse)
library(readxl)
library(jsonlite)

file <- "/home/alec/Projects/Brookings/automation/build/data/automation_workbook4.xlsx"

occs0 <- read_xlsx(file, sheet="occ_usa")

occs1 <- occs0 %>% select(soc_code, soc_desc, soc2_name, soc2_code, automation_potential, emp_chg_1626, emp_2016, wage_avg_2016, log_wage) %>%
              mutate(wage_group = cut(wage_avg_2016, as.numeric(quantile(wage_avg_2016, probs=c(0,0.25,0.5,0.75, 1))), include.lowest=TRUE, ordered_result=TRUE),
                     automation_group = cut(automation_potential, c(0,0.3, 0.7,1), labels=c("Low (0-30%)", "Medium (30-70%)", "High (70-100%)"), include.lowest=TRUE, ordered_result=TRUE))

medians <- occs0 %>% group_by(soc2_name) %>% summarise(median = median(automation_potential)) %>% arrange(desc(median)) %>% mutate(soc2_label=sub(" Occupations", "", medians$soc2_name))

occs2 <- occs1 %>% mutate(nm = factor(soc2_name, levels=medians$soc2_name, labels=medians$soc2_label))

quantile(occs2$wage_avg_2016, probs=c(0,0.25,0.5,0.75, 1))

gg <- ggplot(data=occs2)

gg + geom_point(aes(y=automation_potential, x=log_wage, color=automation_group)) + facet_wrap("nm", ncol=4) + theme_bw() + 
  scale_color_manual(values=c('#fdbe85','#fd8d3c','#d94701')) + scale_x_continuous(breaks=5) + scale_y_continuous(breaks=c(0,0.3,0.7,1)) + 
  labs(color="Automation potential\nrisk groups", x="Log(wage)\n\nLow wage < ----- > High wage", y="<--- Automation potential --->\n")


gg + geom_point(aes(y=nm, x=automation_potential, color=automation_group)) + theme_bw() + theme(legend.position = c("right")) + 
  scale_color_manual(values=c('#fdbe85','#fd8d3c','#d94701')) + scale_x_continuous(breaks=c(0,0.3,0.7,1)) + 
  labs(color="Automation potential\nrisk groups", x="Low <--- Automation potential ---> High", y="Occupation group")
