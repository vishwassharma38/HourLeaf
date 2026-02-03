from django.shortcuts import render
from django.shortcuts import redirect
from django.utils import timezone
from django.http import HttpResponseForbidden

from .models import Flower
from .utils.seeds import random_variation, random_seed
from django.shortcuts import render, get_object_or_404


def plant_flower(request):
    # Check if this browser already owns a flower
    owner_token = request.COOKIES.get("flower_owner")

    if owner_token:
        existing_flower = Flower.objects.filter(owner_token=owner_token).first()
        if existing_flower:
            return redirect("view_flower", flower_id=existing_flower.id)

    # Create the flower
    flower = Flower.objects.create(
        planted_at=timezone.now(),
        variation=random_variation(),
        seed=random_seed(),
    )

    # Redirect to flower page
    response = redirect("view_flower", flower_id=flower.id)

    # Set ownership cookie (1 year lifespan)
    response.set_cookie(
        key="flower_owner",
        value=flower.owner_token,
        max_age=60 * 60 * 24 * 365,
        httponly=True,
        samesite="Strict",
    )

    return response


def view_flower(request, flower_id):
    flower = get_object_or_404(Flower, id=flower_id)

    return render(
        request,
        "flower.html",
        {
            "flower": flower,
        }
    )