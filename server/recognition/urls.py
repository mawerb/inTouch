"""
URL configuration for transcriber app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('transcribe/', views.transcribe_audio, name='transcribe'),
    path('facial_recognition/', views.facial_recognition, name='facial_recognition'),
]
