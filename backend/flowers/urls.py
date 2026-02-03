from django.urls import path
from . import views


urlpatterns = [
    path("plant/", views.plant_flower, name="plant_flower"),
    path("f/<uuid:flower_id>/", views.view_flower, name="view_flower"),
]