const payload = "abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n" +
  "abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n" +
  "abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n";

const  CLIENT_ID = "Client_TESTE_QOS";

export class Util {
  static get payload() {
    return payload;
  }

  static get clientID() {
    return CLIENT_ID;
  }
}
