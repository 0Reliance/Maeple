import { render, RenderOptions } from "@testing-library/react";
import React, { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { Mock, vi } from "vitest";
import {
  AIService,
  AnalyticsService,
  AppDependencies,
  AudioService,
  AuthService,
  CacheService,
  DependencyProvider,
  ErrorLoggerService,
  StorageService,
  VisionService,
} from "../src/contexts/DependencyContext";
import { CircuitState } from "../src/patterns/CircuitBreaker";

// Type-safe mock factory functions
type MockFunction<T extends (...args: any[]) => any> = Mock<Parameters<T>, ReturnType<T>>;

export function createMockVisionService(): VisionService {
  return {
    analyzeFromImage: vi.fn().mockResolvedValue({}),
    generateImage: vi.fn().mockResolvedValue({}),
    getState: vi.fn().mockReturnValue(CircuitState.CLOSED),
    onStateChange: vi.fn().mockReturnValue(() => {}),
  };
}

export function createMockAIService(): AIService {
  return {
    analyze: vi.fn().mockResolvedValue({ content: "{}" }),
    generateResponse: vi.fn().mockResolvedValue(""),
    analyzeAudio: vi.fn().mockResolvedValue({}),
    getState: vi.fn().mockReturnValue(CircuitState.CLOSED),
    onStateChange: vi.fn().mockReturnValue(() => {}),
  };
}

export function createMockAuthService(): AuthService {
  return {
    login: vi.fn().mockResolvedValue({}),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockAudioService(): AudioService {
  return {
    analyzeAudio: vi.fn().mockResolvedValue({}),
    analyzeMultiple: vi.fn().mockResolvedValue([]),
  };
}

export function createMockStorageService(): StorageService {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockCacheService(): CacheService {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockErrorLogger(): ErrorLoggerService {
  return {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    getStats: vi.fn().mockReturnValue({ errors: 0, warnings: 0 }),
  };
}

export function createMockAnalyticsService(): AnalyticsService {
  return {
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackError: vi.fn(),
  };
}

// Create a complete type-safe mock dependencies object
export function createMockDependencies(): AppDependencies {
  return {
    visionService: createMockVisionService(),
    aiService: createMockAIService(),
    authService: createMockAuthService(),
    audioService: createMockAudioService(),
    storageService: createMockStorageService(),
    cacheService: createMockCacheService(),
    errorLogger: createMockErrorLogger(),
    analyticsService: createMockAnalyticsService(),
  };
}

// Default mock dependencies for backward compatibility
export const mockDependencies: AppDependencies = createMockDependencies();

// Helper to reset all mocks in mockDependencies
export function resetAllMocks(): void {
  vi.clearAllMocks();
}

// Custom wrapper with typed dependencies
interface RenderWithDependenciesOptions extends Omit<RenderOptions, "wrapper"> {
  dependencies?: Partial<AppDependencies>;
  initialRoute?: string;
}

const AllTheProviders = ({
  children,
  dependencies = mockDependencies,
}: {
  children: React.ReactNode;
  dependencies?: AppDependencies;
}) => {
  return (
    <DependencyProvider dependencies={dependencies}>
      <MemoryRouter>{children}</MemoryRouter>
    </DependencyProvider>
  );
};

// Enhanced render with dependency override support
export function renderWithDependencies(
  ui: ReactElement,
  options: RenderWithDependenciesOptions = {}
) {
  const { dependencies, initialRoute, ...renderOptions } = options;

  const mergedDependencies: AppDependencies = dependencies
    ? { ...mockDependencies, ...dependencies }
    : mockDependencies;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DependencyProvider dependencies={mergedDependencies}>
      <MemoryRouter initialEntries={initialRoute ? [initialRoute] : ["/"]}>{children}</MemoryRouter>
    </DependencyProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    dependencies: mergedDependencies,
  };
}

// Legacy render for backward compatibility
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
