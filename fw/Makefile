APPLICATION = lwfw
RIOTBASE ?= $(CURDIR)/../../RIOT

BOARD ?= samr21-xpro
SERIAL ?= ATML2127031800001974
include Makefile.vars

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

# general
USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEPKG += nanocbor

# net
USEMODULE += gcoap
USEMODULE += gnrc_icmpv6_echo
USEMODULE += gnrc_ipv6_default
USEMODULE += gnrc_rpl
USEMODULE += auto_init_gnrc_rpl
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default

include $(RIOTBASE)/Makefile.include
