import redis
from app.core.config import settings

try:
    r = redis.from_url(settings.REDIS_URL)
    r.ping()
except Exception:
    import fakeredis
    r = fakeredis.FakeStrictRedis()
