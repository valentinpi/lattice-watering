<<<<<<< HEAD
#include <hdc1000.h>
#include <inttypes.h>
#include <led.h>
#include <shell.h>
#include <stdio.h>

#define PREFIX "[LWFW] "

int main(void) {
    const hdc1000_params_t hdc1000_params = {// Only one device
                                             .addr = 64,
                                             // Only one bus
                                             .i2c = 0,
                                             // In microseconds
                                             .renew_interval = CONFIG_HDC1000_CONVERSION_TIME,
                                             .res = HDC1000_14BIT};

    hdc1000_t hdc1000;
    int res = hdc1000_init(&hdc1000, &hdc1000_params);
    if (res == HDC1000_OK) {
        printf(PREFIX "HDC1000 configured\n");
    }
    int16_t temp = 0, hum = 0;
    hdc1000_read(&hdc1000, &temp, &hum);
    printf(PREFIX "temperature: %" PRId16 "°C, humidity: %" PRId16 "\n", temp / 100, hum / 100);

    uint8_t *shell_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);
=======
/************************************************************/
/*  This firmware utilizes its sensors to water the plants. */
/************************************************************/

#include <inttypes.h>
#include <led.h>
#include <nanocbor/nanocbor.h>
#include <net/gnrc/ipv6.h>
#include <net/gnrc/netreg.h>
#include <net/gnrc/nettype.h>
#include <net/gnrc/sixlowpan.h>
#include <periph/gpio.h>
#include <sched.h>
#include <shell.h>
#include <stdio.h>

#define MSG_QUEUE_SIZE 8
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

    msg_t msg_queue[MSG_QUEUE_SIZE];
    memset(msg_queue, 0, MSG_QUEUE_SIZE * sizeof(msg_t));
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);

    gnrc_netreg_entry_t server = GNRC_NETREG_ENTRY_INIT_PID(GNRC_NETREG_DEMUX_CTX_ALL, thread_getpid());
    gnrc_netreg_register(GNRC_NETTYPE_IPV6, &server);

    while (true) {
        msg_t msg;
        msg_receive(&msg);

        gnrc_pktsnip_t *pkt = msg.content.ptr;

        const uint8_t *data = pkt->next->next->data;
        size_t data_len = pkt->next->next->size;

        uint8_t decoded[32];
        size_t decoded_len = 32;
        nanocbor_value_t value;
        memset(&value, 0, sizeof(value));
        nanocbor_decoder_init(&value, (uint8_t *)&decoded, decoded_len);
        if (data_len > decoded_len) {
            gnrc_pktbuf_release(pkt);
            break;
        }

        int err = nanocbor_get_bstr(&value, &data, &data_len);

        gnrc_pktbuf_release(pkt);
        pkt = NULL;

        if (err != NANOCBOR_OK) {
            continue;
        }

        printf(PREFIX "pump_toggle\n");
    }

    /* Debug Shell */
    const shell_command_t commands[] = {{"pump_toggle", "Toggle the pump", pump_toggle_command}, {NULL, NULL, NULL}};
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(commands, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);
>>>>>>> origin/valentinpi

    return 0;
}
