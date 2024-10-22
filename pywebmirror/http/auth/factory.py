"""
Http.Auth.Factory

NOTE: contains the following class
NOTE:
NOTE: class Factory {
NOTE:     - Config.User user;
NOTE:     - Map<String, Http.Auth.Session> _factory;
NOTE:
NOTE:     + constructor(Config.User: user)
NOTE:     - String generateToken()
NOTE:     + void createSession(Http.Header.Cookie: cookie)
NOTE:     + void destroySession(String: token)
NOTE:     + Boolean validateToken(String: token)
NOTE: }
"""