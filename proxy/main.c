/***********************************************************************************************/
/*  DTLS Proxy Server running in RIOT `native` and routing the traffic through a secure tunnel */
/***********************************************************************************************/

#include <net/gnrc/netreg.h>
#include <shell.h>
#include <string.h>

#define MSG_QUEUE_SIZE 16
#define PREFIX "[LWPROXY] "

msg_t msg_queue[MSG_QUEUE_SIZE];

int main(void) {
    /* Init */
    msg_init_queue(msg_queue, MSG_QUEUE_SIZE);

    /* Debug Shell */
    uint8_t shell_buf[SHELL_DEFAULT_BUFSIZE];
    memset(shell_buf, 0, SHELL_DEFAULT_BUFSIZE);
    shell_run(NULL, (char *)shell_buf, SHELL_DEFAULT_BUFSIZE);

    return 0;
}
