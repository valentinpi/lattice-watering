#include <stdio.h>
#include <string.h>
#include <periph/adc.h>
#include <ztimer.h>
 
#include "shell.h"
int main(void)
{
    puts("Hello World!");

    adc_t pin = ADC_LINE(1);
    adc_res_t RES = ADC_RES_12BIT;
    adc_init(pin);
    int32_t moisture = 0;

    while (true){
	moisture = adc_sample(pin,RES);
	printf("%" PRId32 "\n", moisture);
	ztimer_sleep(ZTIMER_MSEC, 100U);
    }
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
