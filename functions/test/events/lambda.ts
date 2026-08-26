export const event = {
    "version": "2.0",
    "routeKey": "POST /invoices",
    "rawPath": "/qa/invoices",
    "rawQueryString": "",
    "headers": {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "authorization": "Bearer eyJraWQiOiIrNkRZN2dDZEloVFhzRnh1a1greWNwMmtuRkxodlVsWDJSRFZyOU93dXJZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIwNDU4YzQxOC1mMDMxLTcwYTMtNWVkNi0xMjgxZjMyZjFlYWMiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS91cy1lYXN0LTFfSUZFbWJwdGVTIiwiY29nbml0bzp1c2VybmFtZSI6IjA0NThjNDE4LWYwMzEtNzBhMy01ZWQ2LTEyODFmMzJmMWVhYyIsImdpdmVuX25hbWUiOiJTaWRkYXJ0aCBDYXJwZW50ZXIiLCJvcmlnaW5fanRpIjoiNmIxZmNjMTktZjczNy00MDNiLTlmNGEtMzRjYTkzODM1ZDg5IiwiYXVkIjoiM2Iyc3BoYWIyYmxvZnJsNWk0bGZ1NjNpZSIsImV2ZW50X2lkIjoiNjIwOWNkM2MtMDIzMS00MWI2LTk1MTgtYTEyNDUzNmJlMGI4IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3ODczOTk5MzQsImV4cCI6MTc4NzY2MDA2MSwiaWF0IjoxNzg3NjU2NDYxLCJqdGkiOiJkYzAyYjQxNi02MjQ0LTQyMWYtODU0Yy1mZTFiMDE0MTE1MmMiLCJlbWFpbCI6InNpZGRhcnRoY2FycGVudGVyMDgwOEBnbWFpbC5jb20ifQ.GcRoYysiB9vtLTTVqPQqsVezYNIhgq6rONpf2JopEIzVMXNisiLF2rWtoIVa5KdDED0XG6XS6Wzq3lPm39CniSUxgF5eax0RdshGWg29GdLfLu60EE1fH-IAuToiDs_kWKY0uePuwWVaQXeqYfXZ5GYqpqw8nGUFb-uTYAb4IfsjQTr2r93ZTrGPpPRe9SYTWYoVw9xZvNWs9aQkdNJh1EJ3EWpEKVUylgC63zzRDhMGgxfv2YB_mCwWgUwVH_SXAAwOCi5kRJZzbw1lYEtLZA0PMosPdNfbUhTsdAAN9fT0TzRAL6iJuQ1LdKCRPN4hEhjqik33_4EWRyiqp70XLg",
        "content-length": "100",
        "content-type": "application/json",
        "host": "gx4j9u1eh1.execute-api.us-east-1.amazonaws.com",
        "postman-token": "2f451ed8-bc25-4d46-b29e-c31fbdcff9ff",
        "user-agent": "PostmanRuntime/7.56.1",
        "x-amzn-trace-id": "Root=1-6a8d7dee-3132a7d3145c24f225eeb86f",
        "x-forwarded-for": "152.58.56.189",
        "x-forwarded-port": "443",
        "x-forwarded-proto": "https"
    },
    "requestContext": {
        "accountId": "389555019183",
        "apiId": "gx4j9u1eh1",
        "authorizer": {
            "jwt": {
                "claims": {
                    "aud": "3b2sphab2blofrl5i4lfu63ie",
                    "auth_time": "1787399934",
                    "cognito:username": "0458c418-f031-70a3-5ed6-1281f32f1eac",
                    "email": "siddarthcarpenter0808@gmail.com",
                    "email_verified": "true",
                    "event_id": "6209cd3c-0231-41b6-9518-a124536be0b8",
                    "exp": "1787660061",
                    "given_name": "Siddarth Carpenter",
                    "iat": "1787656461",
                    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_IFEmbpteS",
                    "jti": "dc02b416-6244-421f-854c-fe1b0141152c",
                    "origin_jti": "6b1fcc19-f737-403b-9f4a-34ca93835d89",
                    "sub": "0458c418-f031-70a3-5ed6-1281f32f1eac",
                    "token_use": "id"
                },
                "scopes": null
            }
        },
        "domainName": "gx4j9u1eh1.execute-api.us-east-1.amazonaws.com",
        "domainPrefix": "gx4j9u1eh1",
        "http": {
            "method": "POST",
            "path": "/qa/invoices",
            "protocol": "HTTP/1.1",
            "sourceIp": "152.58.56.189",
            "userAgent": "PostmanRuntime/7.56.1"
        },
        "requestId": "CqCdXi3QoAMEPWg=",
        "routeKey": "POST /invoices",
        "stage": "qa",
        "time": "25/Aug/2026:11:35:10 +0000",
        "timeEpoch": 1787657710659
    },
    "body": "{\r\n  \"fileName\": \"medical_invoice.pdf\",\r\n  \"contentType\": \"application/pdf\",\r\n  \"fileSize\":748000\r\n}",
    "isBase64Encoded": false
}