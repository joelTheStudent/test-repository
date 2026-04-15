from django.contrib import admin
from .models import Event, EventShare, EventAttachment

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'start_datetime', 'created_at')
    list_filter = ('all_day',)
    search_fields = ('title', 'owner__email')
    raw_id_fields = ('owner',)

@admin.register(EventShare)
class EventShareAdmin(admin.ModelAdmin):
    list_display = ('event', 'shared_with', 'permission', 'created_at')
    list_filter = ('permission',)

@admin.register(EventAttachment)
class EventAttachmentAdmin(admin.ModelAdmin):
    list_display = ('filename', 'event', 'uploaded_by', 'file_size', 'uploaded_at')
