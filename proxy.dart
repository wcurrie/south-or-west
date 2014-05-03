import "dart:io";
import "package:uri/uri.dart";
import "package:utf/utf.dart";
import 'package:http/http.dart' as http;

final HOST = "127.0.0.1";
final PORT = 5555;
final LOG_REQUESTS = true;

void httpGet(HttpResponse inputResponse) {

  HttpClient h = new HttpClient();

  HttpClientConnection conn = h.getUrl(new Uri.fromString(GETURL));

// Add Headers once conneciton is opened
  conn.onRequest = (HttpClientRequest request) {

// Set auth header using base64 encoded password
    request.headers.add("Authorization", AUTH);

// When all request data has been written close the stream to indicate the end of the request.
    request.outputStream.close();

  };

  conn.onResponse = (HttpClientResponse response) {

//print(response.contentLength);
//print(response.statusCode);


    InputStream i = response.inputStream;

    i.pipe(inputResponse.outputStream);

  };

}


void requestReceivedHandler(HttpRequest inputRequest, HttpResponse inputResponse) {

//inputResponse.headers.set(HttpHeaders.CONTENT_TYPE, "text/html; charset=UTF-8");
  print(inputRequest.headers.value("Host"));

//inputResponse.headers.set("Access-Control-Allow-Origin", inputRequest.headers.value("Host"));



  if (LOG_REQUESTS) {
    print("Request: ${inputRequest.method} ${inputRequest.uri}");
  }

  httpGet(inputResponse);


// String htmlResponse = createHtmlResponse();
//response.outputStream.writeString(htmlResponse);
//response.outputStream.close();
}


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
