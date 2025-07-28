/**
 * Development Tools & User-Friendly Utilities
 * Makes the development experience smoother and debugging easier
 */

export class DeveloperTools {
  /**
   * Auto-detect and fix common React Hooks violations
   */
  static analyzeHookUsage(componentCode: string): {
    violations: string[];
    suggestions: string[];
  } {
    const violations: string[] = [];
    const suggestions: string[] = [];

    // Check for hooks called after conditional returns
    const conditionalReturns = componentCode.match(/if\s*\([^)]+\)\s*{\s*return/g);
    const hookCalls = componentCode.match(/use[A-Z][a-zA-Z]*\(/g);

    if (conditionalReturns && hookCalls) {
      violations.push('Potential hooks called after conditional returns');
      suggestions.push('Move all hook calls to the top of the component');
    }

    return { violations, suggestions };
  }

  /**
   * Auto-escape JSX quotes and entities
   */
  static escapeJSXContent(content: string): string {
    return content
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Generate TypeScript types from data structure
   */
  static inferTypes(data: any, typeName: string): string {
    const generateType = (obj: any, name: string): string => {
      if (Array.isArray(obj)) {
        return `${name}: ${generateType(obj[0], name.slice(0, -1))}[]`;
      }
      
      if (obj && typeof obj === 'object') {
        const props = Object.entries(obj)
          .map(([key, value]) => `  ${key}: ${typeof value}`)
          .join(';\n');
        return `interface ${name} {\n${props};\n}`;
      }
      
      return `${name}: ${typeof obj}`;
    };

    return generateType(data, typeName);
  }

  /**
   * Validate data consistency between components
   */
  static validateDataConsistency(
    dashboardData: any,
    chartData: any
  ): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if key metrics match
    if (dashboardData.currentBalance !== chartData.accountValue) {
      issues.push(`Balance mismatch: Dashboard(${dashboardData.currentBalance}) vs Chart(${chartData.accountValue})`);
    }

    if (Math.abs(dashboardData.principalInvested - chartData.deposits) > 1) {
      issues.push(`Principal mismatch: Dashboard(${dashboardData.principalInvested}) vs Chart(${chartData.deposits})`);
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }
}

/**
 * Component Health Monitor
 * Tracks component performance and suggests optimizations
 */
export class ComponentHealthMonitor {
  private static renderCounts = new Map<string, number>();
  private static lastRenderTime = new Map<string, number>();

  static trackRender(componentName: string): void {
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
    this.lastRenderTime.set(componentName, Date.now());

    // Warn about excessive re-renders
    if (count > 50) {
      console.warn(`⚠️ ${componentName} has rendered ${count} times - consider optimization`);
    }
  }

  static getHealthReport(): string {
    let report = '🏥 Component Health Report\n';
    report += '='.repeat(30) + '\n';

    // Use Array.from() for ES5 compatibility
    const renderCountsArray = Array.from(this.renderCounts.entries());
    for (let i = 0; i < renderCountsArray.length; i++) {
      const [component, count] = renderCountsArray[i];
      const lastRender = this.lastRenderTime.get(component);
      const status = count > 50 ? '🔴 HIGH' : count > 20 ? '🟡 MEDIUM' : '🟢 LOW';
      
      report += `${component}: ${count} renders ${status}\n`;
      if (lastRender) {
        report += `  Last: ${new Date(lastRender).toLocaleTimeString()}\n`;
      }
    }

    return report;
  }
}

/**
 * Auto-formatter for common code patterns
 */
export class CodeFormatter {
  /**
   * Auto-format component props for better readability
   */
  static formatComponentProps(props: Record<string, any>): string {
    return Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `  ${key}="${value}"`;
        } else if (typeof value === 'boolean' && value) {
          return `  ${key}`;
        } else {
          return `  ${key}={${JSON.stringify(value)}}`;
        }
      })
      .join('\n');
  }

  /**
   * Generate consistent styling constants
   */
  static generateStyleConstants(styles: Record<string, string>): string {
    const constants = Object.entries(styles)
      .map(([name, value]) => `export const ${name.toUpperCase()}_STYLES = "${value}";`)
      .join('\n');

    return `// Auto-generated style constants\n${constants}`;
  }
}

/**
 * Data Validation Helper
 * Provides user-friendly validation messages
 */
export class ValidationHelper {
  static validateAccountData(data: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fixes: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: string[] = [];

    // Check required fields with user-friendly messages
    if (!data.currentBalance) {
      errors.push('Account balance is missing');
      fixes.push('Ensure your data source includes a "currentBalance" field');
    }

    if (data.currentBalance < 0) {
      warnings.push('Account balance is negative');
      fixes.push('Verify account data for processing errors');
    }

    // Provide specific guidance
    if (errors.length > 0) {
      fixes.push('Check your data processing script for errors');
      fixes.push('Verify CSV file format matches expected structure');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixes
    };
  }
}
