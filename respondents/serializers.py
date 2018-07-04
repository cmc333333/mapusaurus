from rest_framework import serializers

from respondents.models import Institution


class RespondentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = (
            'institution_id',
            'name',
            'num_loans',
        )
