package main

// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import (
	"context"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"sync"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"
	"github.com/google/A2UI/a2a_agents/go/a2ui"
	"github.com/joho/godotenv"
)

// InMemoryTaskStore implementation
type InMemoryTaskStore struct {
	mu    sync.RWMutex
	tasks map[a2a.TaskID]*a2a.Task
}

func NewInMemoryTaskStore() *InMemoryTaskStore {
	return &InMemoryTaskStore{
		tasks: make(map[a2a.TaskID]*a2a.Task),
	}
}

func (s *InMemoryTaskStore) Save(ctx context.Context, task *a2a.Task, event a2a.Event, prev a2a.TaskVersion) (a2a.TaskVersion, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Basic optimistic concurrency check (ignored for sample simplicity if prev is empty)
	// In a real store, check if existing task version matches prev.

	// Create a deep copy or just store the pointer (for in-memory sample, pointer is risky but okay for simple usage)
	// To be safe, we should clone, but a2a.Task is complex. Storing the pointer for now.
	s.tasks[task.ID] = task

	// Return new version (using timestamp or incremental counter).
	// a2a.TaskVersion is int64.
	return a2a.TaskVersion(len(task.History)), nil
}

func (s *InMemoryTaskStore) Get(ctx context.Context, taskID a2a.TaskID) (*a2a.Task, a2a.TaskVersion, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	task, ok := s.tasks[taskID]
	if !ok {
		return nil, 0, a2a.ErrTaskNotFound
	}
	return task, a2a.TaskVersion(len(task.History)), nil
}

func (s *InMemoryTaskStore) List(ctx context.Context, req *a2a.ListTasksRequest) (*a2a.ListTasksResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var tasks []*a2a.Task
	for _, t := range s.tasks {
		tasks = append(tasks, t)
	}
	// Pagination logic would go here
	return &a2a.ListTasksResponse{Tasks: tasks}, nil
}

// Context key for passing schema
type contextKey string

const schemaContextKey contextKey = "a2ui_schema"

// Main entry point
func main() {
	// Load environment variables from .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it")
	}

	// Define flags for host and port
	host := flag.String("host", "localhost", "Host to bind to")
	port := flag.Int("port", 10002, "Port to bind to")
	flag.Parse()

	// Check for API key
	if os.Getenv("GOOGLE_GENAI_USE_VERTEXAI") != "TRUE" {
		if os.Getenv("GEMINI_API_KEY") == "" {
			log.Fatal("Error: GEMINI_API_KEY environment variable not set and GOOGLE_GENAI_USE_VERTEXAI is not TRUE.")
		}
	}

	baseURL := fmt.Sprintf("http://%s:%d", *host, *port)

	// Load schema and catalog contents
	schemaContent, err := os.ReadFile("../../../../specification/v0_8/json/server_to_client.json")
	if err != nil {
		log.Fatalf("Failed to read schema: %v", err)
	}
	standardCatalogContent, err := os.ReadFile("../../../../specification/v0_8/json/standard_catalog_definition.json")
	if err != nil {
		log.Fatalf("Failed to read standard catalog: %v", err)
	}
	rizzchartsCatalogContent, err := os.ReadFile("rizzcharts_catalog_definition.json")
	if err != nil {
		log.Fatalf("Failed to read rizzcharts catalog: %v", err)
	}

	catalogBuilder := NewComponentCatalogBuilder(
		string(schemaContent),
		map[string]string{
			a2ui.StandardCatalogID: string(standardCatalogContent),
			RizzchartsCatalogURI:   string(rizzchartsCatalogContent),
		},
		a2ui.StandardCatalogID,
	)

	// Providers
	enabledProvider := func(ctx context.Context) (bool, error) {
		return true, nil
	}

	schemaProvider := func(ctx context.Context) (map[string]interface{}, error) {
		if val := ctx.Value(schemaContextKey); val != nil {
			return val.(map[string]interface{}), nil
		}
		return nil, fmt.Errorf("A2UI schema not found in context")
	}

	agent := NewRizzchartsAgent(enabledProvider, schemaProvider)
	executor := NewRizzchartsAgentExecutor(baseURL, catalogBuilder, agent)

	// Setup A2A Server components
	taskStore := NewInMemoryTaskStore()
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Create Request Handler
	requestHandler := a2asrv.NewHandler(
		executor,
		a2asrv.WithTaskStore(taskStore),
		a2asrv.WithLogger(logger),
	)

	// Middleware for CORS
	enableCORS := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
				w.Header().Set("Access-Control-Allow-Headers", "*")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			// Debug: Log headers to check for X-A2A-Extensions
			log.Printf("Received %s request to %s with Headers: %v", r.Method, r.URL.Path, r.Header)

			exts := r.Header.Values("X-A2a-Extensions")

			if len(exts) > 0 {
				log.Printf("Found A2UI Extensions in header: %v. Injecting into context.", exts)
				meta := a2asrv.NewRequestMeta(map[string][]string{
					a2asrv.ExtensionsMetaKey: exts,
				})
				// a2asrv.WithCallContext returns (ctx, callContext). We need the ctx.
				ctx, _ := a2asrv.WithCallContext(r.Context(), meta)
				r = r.WithContext(ctx)
			} else {
				log.Println("No A2UI Extensions found in header.")
			}

			next.ServeHTTP(w, r)
		})
	}

	mux := http.NewServeMux()

	// Agent Card Endpoint
	agentCardHandler := a2asrv.NewStaticAgentCardHandler(executor.GetAgentCard())
	mux.Handle("/.well-known/agent-card.json", agentCardHandler)

	// A2A JSON-RPC Handler
	jsonRPCHandler := a2asrv.NewJSONRPCHandler(requestHandler)
	mux.Handle("/", jsonRPCHandler)

	addr := fmt.Sprintf("%s:%d", *host, *port)
	log.Printf("Starting server on %s", baseURL)

	// Wrap mux with CORS
	if err := http.ListenAndServe(addr, enableCORS(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
