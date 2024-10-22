"""
Http.Generator.Abstract

NOTE: - Define a Class that:
NOTE:   1. initializes with a header Object, a body Object,
NOTE:      and other parameters that is utilized by any Engine
NOTE:      objects.
NOTE:   2. Generate a Request object base on header and body.
NOTE:   3. Decides which engine to generate Response object.
NOTE:   4. Use the selected engine to generate Response object.
NOTE:   5. And return the Response Object.
"""