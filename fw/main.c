/******************/
/*  Node Firmware */
/******************/

#include "main.h"

static bool pump_activated = false;

static int32_t soil_dry_value = 2920;
static int32_t soil_wet_value = 1400;

void pump_init(void) {
    gpio_init(PUMP_PA13, GPIO_OUT);
    gpio_init(PUMP_PA28, GPIO_OUT);
}

void pump_toggle(void) {
    mutex_lock(&pump_mutex);
    gpio_toggle(PUMP_PA28);
    gpio_toggle(PUMP_PA13);
    pump_activated = !pump_activated;
    mutex_unlock(&pump_mutex);
}

void soil_init(void) { adc_init(SOIL_PIN); }

uint8_t soil_read(void) {
    mutex_lock(&soil_mutex);
    int32_t moisture_value = adc_sample(SOIL_PIN, SOIL_RES);
    int32_t moisture_percentage = (moisture_value - soil_dry_value) * 100 / (soil_wet_value - soil_dry_value);
    mutex_unlock(&soil_mutex);
    return (uint8_t)moisture_percentage;
}

int pump_toggle_command(int argc, char **argv) {
    (void)argc;
    (void)argv;

    pump_toggle();

    return 0;
}

int calibration_command(int argc, char **argv) {
    if (argc < 3) {
        printf(PREFIX "Too few arguments");
    }

    mutex_lock(&soil_mutex);
    soil_dry_value = strtol(argv[1], NULL, 10);
    soil_wet_value = strtol(argv[2], NULL, 10);
    mutex_unlock(&soil_mutex);

    return 0;
}

void cred_init(void) {
    credman_credential_t cred = {
        .type = CREDMAN_TYPE_PSK,
        .tag = 1, // Should be nonzero! 0 is an invalid tag.
        .params = {.psk = {.key = {.s = PSK_KEY, .len = PSK_KEY_LEN},
                           // Leave the hint blank, see https://www.ietf.org/rfc/rfc4279.txt
                           .hint = {0},
                           .id = {.s = PSK_DEFAULT_IDENTITY, .len = PSK_DEFAULT_IDENTITY_LEN}}}};
    credman_add(&cred);

    sock_dtls_t *sock = gcoap_get_sock_dtls();
    sock_dtls_add_credential(sock, 1);
}

void net_init(void) {
    netif_ieee802154 = gnrc_netif_iter(NULL); // Note that we included `gnrc_netif_single`
    assert(netif_ieee802154->device_type == NETDEV_TYPE_IEEE802154);
    printf(PREFIX "IEEE802154 interface found\n");
    ipv6_addr_from_str(&host_ip, HOST_IP_ADDR); // Note that via RPL, the node gets added a global address automatically
    memcpy(host_ep.addr.ipv6, host_ip.u8, 16);
    host_ep.family = AF_INET6;
    host_ep.netif = netif_ieee802154->pid;
    host_ep.port = CONFIG_GCOAPS_PORT;
}

void *wdt_thread(void *arg) {
    (void)arg;

    wdt_setup_reboot(0, 10e3);
    wdt_start();
    while (1) {
        ztimer_sleep(ZTIMER_SEC, 5);
        wdt_kick();
    }
}

void *data_thread(void *arg) {
    (void)arg;

    uint8_t buf[256];
    memset(buf, 0, 256);

    // Put packet metadata
    coap_pkt_t pdu = {0};
    gcoap_req_init(&pdu, buf, 256, COAP_POST, "/data");
    coap_opt_add_format(&pdu, COAP_FORMAT_CBOR);
    coap_hdr_set_type(pdu.hdr, COAP_TYPE_NON);
    ssize_t meta_len = coap_opt_finish(&pdu, COAP_OPT_FINISH_PAYLOAD);
    while (true) {
        // Obtain information
        uint8_t humidity = soil_read();
        netstats_t stats = netif_ieee802154->ipv6.stats;

        // Write data
        nanocbor_encoder_t enc = {0};
        nanocbor_encoder_init(&enc, pdu.payload, 28);
        nanocbor_fmt_uint(&enc, humidity);
        mutex_lock(&pump_mutex);
        nanocbor_fmt_bool(&enc, pump_activated);
        mutex_unlock(&pump_mutex);
        mutex_lock(&soil_mutex);
        nanocbor_fmt_int(&enc, soil_dry_value);
        nanocbor_fmt_int(&enc, soil_wet_value);
        mutex_unlock(&soil_mutex);
        nanocbor_fmt_uint(&enc, stats.rx_bytes);
        nanocbor_fmt_uint(&enc, stats.rx_count);
        nanocbor_fmt_uint(&enc, stats.tx_bytes);
        nanocbor_fmt_uint(&enc, stats.tx_unicast_count);
        nanocbor_fmt_uint(&enc, stats.tx_mcast_count);
        nanocbor_fmt_uint(&enc, stats.tx_success);
        nanocbor_fmt_uint(&enc, stats.tx_failed);
        size_t payload_len = nanocbor_encoded_len(&enc);

        // Post data
        gcoap_req_send(buf, meta_len + payload_len, &host_ep, NULL, NULL);

        memset(pdu.payload, 0, payload_len);
        ztimer_sleep(ZTIMER_SEC, DATA_INTERVAL);
    }

    return NULL;
}

ssize_t pump_handler(coap_pkt_t *pkt, uint8_t *buf, size_t len, void *context) {
    (void)pkt;
    (void)buf;
    (void)len;
    (void)context;

    pump_toggle();

    return 0;
}

ssize_t calibration_handler(coap_pkt_t *pkt, uint8_t *buf, size_t len, void *context) {
    (void)pkt;
    (void)context;

    mutex_lock(&soil_mutex);
    nanocbor_value_t dec = {0};
    nanocbor_decoder_init(&dec, buf, len);
    nanocbor_get_int32(&dec, &soil_dry_value);
    nanocbor_get_int32(&dec, &soil_wet_value);
    mutex_unlock(&soil_mutex);

    return 0;
}

int main(void) {
    /* Init */
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);
    pump_init();
    soil_init();
    cred_init();
    net_init();

    /* WDT */
    thread_create((char *)wdt_thread_stack, THREAD_STACKSIZE_SMALL, THREAD_PRIORITY_MAIN - 1, 0, wdt_thread, NULL,
                  "wdt");

    /* Data */
    thread_create((char *)data_thread_stack, THREAD_STACKSIZE_LARGE, THREAD_PRIORITY_MAIN - 1, 0, data_thread, NULL,
                  "data");

    /* CoAP Methods */
    coap_resource_t res[2] = {{.methods = COAP_POST, .handler = pump_handler, .path = "/pump_toggle"},
                              {.methods = COAP_POST, .handler = calibration_handler, .path = "/calibrate_sensor"}};
    gcoap_listener_t listener = {.resources = res, .resources_len = sizeof(res)};
    gcoap_register_listener(&listener);

    /* Debug Shell */
    const shell_command_t commands[] = {{"pump_toggle", "Toggle the pump", pump_toggle_command},
                                        {"calibration", "Calibrate the humidity sensor", calibration_command},
                                        {NULL, NULL, NULL}};
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(commands, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
