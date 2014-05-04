import "dart:io";
import "package:uri/uri.dart";
import "package:utf/utf.dart";
import 'package:http/http.dart' as http;

final HOST = "0.0.0.0";
final PORT = int.parse(Platform.environment.containsKey('PORT') ? Platform.environment['PORT'] : "5555");

void main() {

  HttpServer.bind(HOST, PORT).then((server) {
    server.listen((HttpRequest request) {
      request.response
        ..headers.set("Access-Control-Allow-Origin", "*")
        ..headers.set("Access-Control-Allow-Credentials", "true")
        ..headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE")
        ..headers.set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Request-With")
        ..headers.set("Access-Control-Max-Age", "86400");

      print(request.uri);

      http.get("http://www.bom.gov.au" + request.uri.toString()).then((http.Response response) {
        request.response.headers.add("Content-Type", "application/json");
        request.response.add(response.bodyBytes);
        request.response.close();
      });
    });
  });

  print("Serving proxy on http://${HOST}:${PORT}.");
}
