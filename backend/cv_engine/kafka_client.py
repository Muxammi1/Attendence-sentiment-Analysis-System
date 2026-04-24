import json
from django.conf import settings
# Graceful degradation logic for development/stub modes
try:
    from kafka import KafkaProducer, KafkaConsumer
    _KAFKA_AVAILABLE = True
    base_producer = KafkaProducer(
        bootstrap_servers=settings.KAFKA_BROKER_URL,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
except (ImportError, Exception):
    _KAFKA_AVAILABLE = False
    base_producer = None

class KafkaProducerWrapper:
    @staticmethod
    def publish(topic, message):
        if _KAFKA_AVAILABLE and base_producer:
            base_producer.send(topic, message)
            base_producer.flush()
        else:
            print(f"[KAFKA STUB] Emitted to {topic}: {message}")

class KafkaConsumerWrapper:
    def __init__(self, topic, group_id='aasas_consumer_group'):
        self.topic = topic
        if _KAFKA_AVAILABLE:
            self.consumer = KafkaConsumer(
                self.topic,
                bootstrap_servers=settings.KAFKA_BROKER_URL,
                group_id=group_id,
                value_deserializer=lambda x: json.loads(x.decode('utf-8'))
            )
        else:
            self.consumer = []

    def consume(self):
        if not _KAFKA_AVAILABLE:
            print(f"[KAFKA STUB] Consuming events for {self.topic} blocked. Kafka broker missing.")
            return []
        return self.consumer
