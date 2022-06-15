/* Attempt at manually pinging the br using a raw IP packet. */

#include <arpa/inet.h>
#include <errno.h>
#include <netinet/ip.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static const char *IFACE_STR = "tap0";
// static const char *IFACE_STR = "lo";
// static const char *ADDR_STR = "fe80::dc7d:20ff:fe37:db1d";
static const char *ADDR_STR = "fe80::89:5cff:fee5:3d10";
// static const char *ADDR_STR = "::";

int main(void) {
    int sock = socket(AF_INET6, SOCK_RAW, IPPROTO_RAW);
    struct in6_addr addr;
    memset(&addr, 0, sizeof(addr));
    inet_pton(AF_INET6, ADDR_STR, &addr);
    struct sockaddr_in6 sockaddr = {
        .sin6_addr = addr, .sin6_flowinfo = 0, .sin6_family = AF_INET6, .sin6_port = 0, .sin6_scope_id = 0x20};
    const char *DATA = "\x44\x5b\x4c\x57\x42";
    printf("%d\n", sendto(sock, DATA, 5, 0, (struct sockaddr *)&sockaddr, sizeof(sockaddr)));
    close(sock);

    return EXIT_SUCCESS;
}
