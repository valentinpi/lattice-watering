#include <hdc1000.h>
#include <inttypes.h>
#include <led.h>
#include <shell.h>
#include <stdio.h>

#define PREFIX "[LWFW] "

int main(void) {
    /* HDC1000 Initialization Code */
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

    /* Networking Code */

    uint8_t *shell_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
