#include <stdio.h>
#include <string.h>
#include <periph/adc.h>
#include <periph/gpio.h>
#include <ztimer.h>
 
#include "shell.h"
int main(void)
{
    puts("Hello World!");
    adc_t pin0 = ADC_LINE(0);
    adc_t pin1 = ADC_LINE(1);
    adc_res_t RES = ADC_RES_10BIT;
    adc_init(pin0);
    adc_init(pin1);
    int moisture0 = 0;
    int moisture1 = 0;

    while (true){
	moisture0 = adc_sample(pin0,RES);
	moisture1 = adc_sample(pin1,RES);
	printf("Moisture0: %i \n", moisture0);
	printf("Moisture1: %i \n", moisture1);
	ztimer_sleep(ZTIMER_MSEC, 100U);
    }


//    gpio_mode_t mode = GPIO_IN;
//    gpio_t pin = GPIO_PIN(0,7);
//    gpio_init(pin,mode);
//    while(true){
//    	int moisture = gpio_read(pin);
//    	printf("Moisture %i \n",moisture);
//	ztimer_sleep(ZTIMER_MSEC, 100U);
//    }
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, line_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
