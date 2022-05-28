/************************************************************/
/*  This firmware utilizes its sensors to water the plants. */
/************************************************************/

#include <inttypes.h>
#include <led.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/nettype.h>
#include <net/gnrc/sixlowpan.h>
#include <net/gnrc/udp.h>
#include <periph/gpio.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>

#define PREFIX "[LWFW] "

// Controls the IN1 input pin of the motor board.
static const gpio_t PUMP_PA13 = GPIO_PIN(0, 13);
// Controls the EEP sleep mode pin of the motor board.
static const gpio_t PUMP_PA28 = GPIO_PIN(0, 28);

void pump_setup(void) {
    gpio_init(PUMP_PA13, GPIO_OUT);
    gpio_init(PUMP_PA28, GPIO_OUT);
}

void pump_toggle(void) {
    gpio_toggle(PUMP_PA28);
    gpio_toggle(PUMP_PA13);
}

int pump_toggle_command(int argc, char **argv) {
    (void)argc;
    (void)argv;

    pump_toggle();

    return 0;
}

int main(void) {
    /* Board initialization */
    pump_setup();

    /* Debug Shell */
    const shell_command_t commands[] = {{"pump_toggle", "Toggle the pump", pump_toggle_command}, {NULL, NULL, NULL}};
    uint8_t *shell_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(commands, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
