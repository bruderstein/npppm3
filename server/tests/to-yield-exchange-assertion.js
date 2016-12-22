
module.exports = {
  installInto: function (expect) {
    expect.addAssertion('<object> to yield exchange <object>', function (expect, server, exchange) {
      return new Promise((resolve, reject) => {
        server.inject(exchange.request, function (response) {
          resolve(response)
        });
      }).then(response => {
        expect.errorMode = 'bubble';
        if (exchange.result) {
          expect(response.result, 'to satisfy', exchange.result);
        }
        if (exchange.response) {
          expect(response, 'to satisfy', exchange.response)
        }
      });
    });
  }
}

