{{/*
Expand the name of the chart.
*/}}
{{- define "29-graphql-yoga.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "29-graphql-yoga.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "29-graphql-yoga.labels" -}}
helm.sh/chart: {{ include "29-graphql-yoga.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "29-graphql-yoga.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "29-graphql-yoga.selectorLabels" -}}
app.kubernetes.io/name: {{ include "29-graphql-yoga.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "29-graphql-yoga.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "29-graphql-yoga.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
