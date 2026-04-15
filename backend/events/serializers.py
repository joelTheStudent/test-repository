from rest_framework import serializers
from .models import Event, EventShare, EventAttachment
from accounts.serializers import UserSerializer

class EventAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EventAttachment
        fields = ('id', 'filename', 'file_size', 'content_type', 'uploaded_by', 'uploaded_at', 'file_url')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class EventShareSerializer(serializers.ModelSerializer):
    shared_with = UserSerializer(read_only=True)
    shared_with_email = serializers.EmailField(write_only=True)

    class Meta:
        model = EventShare
        fields = ('id', 'shared_with', 'shared_with_email', 'permission', 'created_at')
        read_only_fields = ('id', 'created_at')

class EventSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    attachments = EventAttachmentSerializer(many=True, read_only=True)
    shares = EventShareSerializer(many=True, read_only=True)
    user_permission = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'owner', 'title', 'description', 'start_datetime', 'end_datetime',
                  'all_day', 'color', 'created_at', 'updated_at', 'attachments', 'shares', 'user_permission')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_user_permission(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        user = request.user
        if obj.owner == user:
            return 'owner'
        try:
            share = obj.shares.get(shared_with=user)
            return share.permission
        except EventShare.DoesNotExist:
            return None

class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'start_datetime', 'end_datetime', 'all_day', 'color')
        read_only_fields = ('id',)

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
