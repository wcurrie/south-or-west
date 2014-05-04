import "dart:io";
import "package:uri/uri.dart";
import "package:utf/utf.dart";
import 'package:http/http.dart' as http;

final HOST = "0.0.0.0";
final PORT = int.parse(Platform.environment.containsKey('PORT') ? Platform.environment['PORT'] : "5555");
final LOCAL_MODE = Platform.executableArguments.contains('--local-mode');

serveFile(String name, HttpRequest request, String type) {
  new File(name).readAsBytes().then((List<int> s) {
    request.response
      ..headers.add("Content-Type", type)
      ..add(s)
      ..close();
  });
}

makeProxyRequest(HttpRequest request) {
  request.response
    ..headers.set("Access-Control-Allow-Origin", "*")
    ..headers.set("Access-Control-Allow-Credentials", "true")
    ..headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE")
    ..headers.set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Request-With")
    ..headers.set("Access-Control-Max-Age", "86400");

  http.get("http://www.bom.gov.au" + request.uri.toString()).then((http.Response response) {
    request.response
      ..headers.add("Content-Type", "application/json")
      ..add(response.bodyBytes)
      ..close();
  });
}

void main() {
  print(Platform.executableArguments);

  HttpServer.bind(HOST, PORT).then((server) {
    server.listen((HttpRequest request) {
      print(request.uri);

      var file = request.uri.path;
      if (file == "/index.html" || file == "/") {
        serveFile("index.html", request, "text/html");
      } else if (file == "/favicon.ico") {
        serveFile("favicon.ico", request, "image/vnd.microsoft.icon");
      } else if (file.startsWith("/fwo")) {
        if (LOCAL_MODE) {
          serveFile(request.uri.pathSegments.last, request, "application/json");
        } else {
          makeProxyRequest(request);
        }
      }
    });
  });

  print("Serving proxy on http://${HOST}:${PORT}.");
}
