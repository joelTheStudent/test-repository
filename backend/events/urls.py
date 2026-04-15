from django.urls import path
from . import views

urlpatterns = [
    path('', views.EventListCreateView.as_view(), name='event_list_create'),
    path('<uuid:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('<uuid:pk>/share/', views.EventShareView.as_view(), name='event_share'),
    path('<uuid:pk>/attachments/', views.EventAttachmentUploadView.as_view(), name='event_attachments'),
    path('<uuid:pk>/attachments/<uuid:attachment_id>/', views.EventAttachmentDeleteView.as_view(), name='event_attachment_delete'),
]
