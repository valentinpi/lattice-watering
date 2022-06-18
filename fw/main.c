/******************/
/*  Node Firmware */
/******************/

#include "main.h"

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

int pump_toggle_command(int argc, char **argv) {
    (void)argc;
    (void)argv;

    pump_toggle();

    return 0;
}

void net_init(void) {
    netif_ieee802154 = gnrc_netif_iter(NULL);  // Note that we included `gnrc_netif_single`
    assert(netif_ieee802154->device_type == NETDEV_TYPE_IEEE802154);
    printf(PREFIX "IEEE802154 interface found\n");
    // Note that via RPL, the node gets added a global address automatically
    ipv6_addr_from_str(&host_ip, HOST_IP_ADDR);
    memcpy(host_ep.addr.ipv6, host_ip.u8, 16);
    host_ep.family = AF_INET6;
    host_ep.netif = netif_ieee802154->pid;
    host_ep.port = COAP_PORT;
}

void cred_init(void) {
    credman_credential_t cred = {.tag = 1};
    credman_load_private_ecc_key(&private, private_len, &cred);
    ecdsa_public_key_t pub = {};
    credman_load_public_key(&public, public_len, &pub);
    cred.params.ecdsa.public_key = pub;
    credman_add(&cred);

    // sock_dtls_t *sock = gcoap_get_sock_dtls();
    // sock_dtls_add_credential(sock, 1);
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

    while (true) {
        // Put packet metadata
        coap_pkt_t pdu = {};
        uint8_t buf[CONFIG_GCOAP_PDU_BUF_SIZE];
        memset(buf, 0, CONFIG_GCOAP_PDU_BUF_SIZE);

        gcoap_req_init(&pdu, buf, CONFIG_GCOAP_PDU_BUF_SIZE, COAP_POST, "/data");
        coap_opt_add_format(&pdu, COAP_FORMAT_CBOR);
        coap_hdr_set_type(pdu.hdr, COAP_TYPE_NON);
        ssize_t meta_len = coap_opt_finish(&pdu, COAP_OPT_FINISH_PAYLOAD);

        mutex_lock(&pump_mutex);

        // Dummy number
        uint8_t humidity = 50;

        // Write data
        nanocbor_encoder_t enc = {};
        nanocbor_encoder_init(&enc, pdu.payload, 28);
        nanocbor_fmt_int(&enc, humidity);
        nanocbor_fmt_bool(&enc, pump_activated);
        size_t payload_len = nanocbor_encoded_len(&enc);

        // Post the data
        gcoap_req_send(buf, meta_len + payload_len, &host_ep, NULL, NULL);

        mutex_unlock(&pump_mutex);
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

    printf(PREFIX "Toggle pump.");
    pump_toggle();

    return 0;
}

int main(void) {
    /* Init */
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);
    pump_init();
    net_init();
    cred_init();

    /* WDT */
    thread_create((char *)wdt_thread_stack, THREAD_STACKSIZE_DEFAULT, THREAD_PRIORITY_MAIN - 1, 0, wdt_thread, NULL,
                  "wdt");

    /* Data */
    thread_create((char *)data_thread_stack, THREAD_STACKSIZE_LARGE, THREAD_PRIORITY_MAIN - 1, 0, data_thread, NULL,
                  "data");

    coap_resource_t res = {.methods = COAP_POST, .handler = pump_handler, .path = "/"};
    gcoap_listener_t listener = {.resources = &res, .resources_len = sizeof(res)};
    gcoap_register_listener(&listener);

    /* Debug Shell */
    const shell_command_t commands[] = {{"pump_toggle", "Toggle the pump", pump_toggle_command}, {NULL, NULL, NULL}};
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(commands, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
