import "dart:io";
import "package:uri/uri.dart";
import "package:utf/utf.dart";
import 'package:http/http.dart' as http;

final HOST = "0.0.0.0";
final PORT = int.parse(Platform.environment.containsKey('PORT') ? Platform.environment['PORT'] : "5555");
final LOCAL_MODE = Platform.executableArguments.contains('--local-mode');

serveFile(String name, HttpRequest request, String type) {
  var file = new File(name);
  file.exists().then((exists) {
    if (exists) {
      print("serving file " + name);
      file.readAsBytes().then((List<int> s) {
        request.response
          ..headers.add("Content-Type", type)
          ..add(s)
          ..close();
      });
    } else {
      notFound(request);
    }
  });
}

addCorsHeaders(HttpRequest request) {
  request.response
    ..headers.set("Access-Control-Allow-Origin", "*")
    ..headers.set("Access-Control-Allow-Credentials", "true")
    ..headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE")
    ..headers.set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Request-With")
    ..headers.set("Access-Control-Max-Age", "86400");
}

makeProxyRequest(HttpRequest request) {
  http.get("http://www.bom.gov.au" + request.uri.toString()).then((http.Response response) {
    request.response
      ..headers.add("Content-Type", "application/json")
      ..add(response.bodyBytes)
      ..close();
  });
}

notFound(HttpRequest request) {
  request.response
    ..statusCode = 404
    ..reasonPhrase = "Not found"
    ..close();
}

void main() {
  print(Platform.executableArguments);

  Map fileTypes = {
    "html": "text/html",
    "js": "text/javascript",
    "css": "text/css",
    "map": "application.json", // source map
    "svg": "text/xml+svg",
    "ttf": "text/plain",
    "woff": "text/plain",
    "ico": "image/vnd.microsoft.icon",
  };

  HttpServer.bind(HOST, PORT).then((server) {
    server.listen((HttpRequest request) {
      var file = request.uri.path;
      if (file.startsWith("/fwo")) {
        // CORS headers only required if .html is hosted elsewhere
        addCorsHeaders(request);
        if (LOCAL_MODE) {
          serveFile("test-data/10-may/" + request.uri.pathSegments.last, request, "application/json");
        } else {
          print("proxying " + request.uri.toString());
          makeProxyRequest(request);
        }
      } else {
        if (file == "/") {
          var userAgent = request.headers.value(HttpHeaders.USER_AGENT);
          file = userAgent != null && userAgent.contains("Mobi") ? "/mobile.html" : "/index.html";
        }
        int dot = file.lastIndexOf(".");
        if (dot != -1) {
          var suffix = file.substring(dot + 1);
          String contentType = fileTypes[suffix];
          if (contentType != null) {
            serveFile(file.substring(1), request, contentType);
            return;
          }
        }

        print("Not found: " + file);
        notFound(request);
      }
    });
  });

  print("Serving proxy on http://${HOST}:${PORT}.");
}
