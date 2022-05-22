APPLICATION = lwfw
BOARD ?= samr21-xpro
RIOTBASE ?= $(CURDIR)/../../RIOT

QUIET ?= 1

MAKEFLAGS += -j

USEMODULE += hdc1000
USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands

#USEMODULE += gnrc_ipv6_default
#USEMODULE += auto_init_gnrc_netif
#USEMODULE += netdev_default

USEMODULE += gnrc_nettype_udp
USEMODULE += gnrc_udp
USEMODULE += gnrc_ipv6
USEMODULE += gnrc_sixlowpan
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default

include $(RIOTBASE)/Makefile.include
