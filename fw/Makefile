APPLICATION = lwfw
BOARD ?= samr21-xpro
<<<<<<< HEAD
RIOTBASE ?= $(CURDIR)/../../RIOT

QUIET ?= 1

USEMODULE += hdc1000
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += ps
=======
SERIAL ?= ATML2127031800001974
RIOTBASE ?= $(CURDIR)/../../RIOT

MAKEFLAGS += -j
DEVELHELP ?= 1
QUIET ?= 1

USEMODULE += ps
USEMODULE += shell
USEMODULE += shell_commands
USEPKG += nanocbor

USEMODULE += gnrc_sixlowpan
USEMODULE += gnrc_nettype_ipv6
USEMODULE += gnrc_ipv6
USEMODULE += gnrc_netif_single
USEMODULE += auto_init_gnrc_netif
USEMODULE += netdev_default
>>>>>>> origin/valentinpi

include $(RIOTBASE)/Makefile.include
