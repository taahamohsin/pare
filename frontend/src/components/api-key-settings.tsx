import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconKey, IconLoader2, IconTrash, IconExternalLink } from "@tabler/icons-react";
import { useUserApiKeys, useCreateApiKey, useDeleteApiKey } from "@/lib/useApiKeys";
import { useOpenRouterModels } from "@/lib/useOpenRouter";

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [showInput, setShowInput] = useState(false);

  const { data: apiKeysData, isLoading } = useUserApiKeys();
  const { data: modelsData } = useOpenRouterModels();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const existingKey = apiKeysData?.data?.find((k) => k.provider === 'openrouter');
  const models = modelsData?.data || [];

  const handleSave = async () => {
    if (!apiKey.trim()) {
      return;
    }

    await createMutation.mutateAsync({
      provider: 'openrouter',
      api_key: apiKey,
      model_preference: selectedModel || undefined
    });

    setApiKey("");
    setSelectedModel("");
    setShowInput(false);
  };

  const handleDelete = async () => {
    if (!existingKey) return;

    if (confirm("Are you sure you want to delete your OpenRouter API key? You'll fall back to using the free Gemini model.")) {
      await deleteMutation.mutateAsync(existingKey.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconKey className="h-5 w-5" />
            OpenRouter API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconKey className="h-5 w-5" />
          OpenRouter API Key
        </CardTitle>
        <CardDescription>
          Use your own OpenRouter API key to access premium AI models for better cover letter generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm">
          <p className="text-blue-900 dark:text-blue-100">
            Add your own OpenRouter API key to access premium AI models like Claude 3.5 Sonnet, GPT-4, and more.
            {' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1 font-medium hover:text-blue-700 dark:hover:text-blue-300"
            >
              Get your key here
              <IconExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {existingKey ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md bg-secondary/50">
              <div className="flex-1">
                <p className="text-sm font-medium">API Key Connected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Model: {existingKey.model_preference || 'Default (Claude 3.5 Sonnet)'}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : showInput ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-or-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Your API key will be encrypted and stored securely
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Preferred Model (Optional)</Label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model (default: Claude 3.5 Sonnet)" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ~${parseFloat(model.pricing.prompt) * 1000}/1K tokens
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || !apiKey.trim()}
              >
                {createMutation.isPending ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Key"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInput(false);
                  setApiKey("");
                  setSelectedModel("");
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowInput(true)} className="w-full">
            <IconKey className="h-4 w-4 mr-2" />
            Add OpenRouter API Key
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
