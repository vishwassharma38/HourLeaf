from django.db import models
import uuid
import secrets
from django.db import models


class Flower(models.Model):
    VARIATION_CHOICES = [
        ("red", "Red"),
        ("purple", "Purple"),
        ("green", "Green"),
    ]

    # Public identifier (used in URL)
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    # When the seed was planted (absolute truth)
    planted_at = models.DateTimeField()

    # Flower color / type
    variation = models.CharField(
        max_length=10,
        choices=VARIATION_CHOICES
    )

    # Random seed for deterministic visuals
    seed = models.PositiveIntegerField()

    # Secret token proving ownership
    owner_token = models.CharField(
        max_length=64,
        unique=True,
        editable=False
    )

    # Metadata only (never used for logic)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Generate owner token once, on creation
        if not self.owner_token:
            self.owner_token = secrets.token_hex(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Flower {self.id} ({self.variation})"
