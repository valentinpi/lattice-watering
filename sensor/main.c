#include <stdio.h>
#include <string.h>
#include <periph/adc.h>
#include <periph/gpio.h>
#include <ztimer.h>
 
#include "shell.h"
int main(void)
{
    const int DRY_VALUE = 2920;
    const int WET_VALUE = 1400;
    adc_t pin = ADC_LINE(1);
    adc_res_t RES = ADC_RES_12BIT;
    adc_init(pin);
    int moisture_value = 0;
    int moisture_percentage = 0;

    while (true){
	moisture_value = adc_sample(pin,RES);
	moisture_percentage = (moisture_value - DRY_VALUE)*100/(WET_VALUE-DRY_VALUE);
	printf("Moisture: %i \n", moisture_percentage);
	ztimer_sleep(ZTIMER_MSEC, 100U);
    }

    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
