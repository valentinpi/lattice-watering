#pragma once

unsigned char cred_private_der[] = {
  0x30, 0x54, 0x02, 0x01, 0x01, 0x04, 0x14, 0xa0, 0x32, 0xd9, 0x58, 0x89,
  0x75, 0xad, 0x7c, 0xe6, 0xbb, 0x58, 0xbf, 0x9b, 0x5c, 0x08, 0x10, 0x78,
  0x66, 0xcf, 0x6a, 0xa0, 0x0b, 0x06, 0x09, 0x2b, 0x24, 0x03, 0x03, 0x02,
  0x08, 0x01, 0x01, 0x01, 0xa1, 0x2c, 0x03, 0x2a, 0x00, 0x04, 0x99, 0x9a,
  0x25, 0x63, 0x42, 0x63, 0x2e, 0x1b, 0x09, 0x30, 0x94, 0x8f, 0x8e, 0x49,
  0x5c, 0x90, 0xe6, 0xd6, 0xd2, 0x48, 0xa3, 0x26, 0x61, 0x16, 0xbe, 0xd3,
  0x65, 0x58, 0x05, 0x9b, 0x92, 0xdf, 0x41, 0x3e, 0xa0, 0x84, 0x64, 0x3d,
  0x6d, 0xb1
};
unsigned int cred_private_der_len = 86;

unsigned char cred_public_der[] = {
  0x30, 0x42, 0x30, 0x14, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
  0x01, 0x06, 0x09, 0x2b, 0x24, 0x03, 0x03, 0x02, 0x08, 0x01, 0x01, 0x01,
  0x03, 0x2a, 0x00, 0x04, 0x99, 0x9a, 0x25, 0x63, 0x42, 0x63, 0x2e, 0x1b,
  0x09, 0x30, 0x94, 0x8f, 0x8e, 0x49, 0x5c, 0x90, 0xe6, 0xd6, 0xd2, 0x48,
  0xa3, 0x26, 0x61, 0x16, 0xbe, 0xd3, 0x65, 0x58, 0x05, 0x9b, 0x92, 0xdf,
  0x41, 0x3e, 0xa0, 0x84, 0x64, 0x3d, 0x6d, 0xb1
};
unsigned int cred_public_der_len = 68;