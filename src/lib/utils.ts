import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 클래스 이름 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 공통 유틸리티 함수
 */

/**
 * 에러를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * Supabase 에러를 사용자 친화적인 메시지로 변환
 */
export function getSupabaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message
    
    // 일반적인 Supabase 에러 메시지를 한국어로 변환
    if (message.includes('duplicate key')) {
      return '이미 존재하는 데이터입니다.'
    }
    if (message.includes('foreign key')) {
      return '관련된 데이터가 존재하지 않습니다.'
    }
    if (message.includes('permission denied') || message.includes('policy')) {
      return '권한이 없습니다.'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return '네트워크 오류가 발생했습니다. 연결을 확인해주세요.'
    }
    
    return message
  }
  
  return getErrorMessage(error)
}

/**
 * 안전한 로깅 함수 (프로덕션에서는 제한적으로 로깅)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    if (context) {
      console.error(`[${context}]`, error)
    } else {
      console.error(error)
    }
  }
  // 프로덕션에서는 에러 추적 서비스로 전송할 수 있음
}

/**
 * 에러를 로깅하고 사용자 친화적인 메시지 반환
 */
export function handleError(error: unknown, context?: string): string {
  logError(error, context)
  return getSupabaseErrorMessage(error)
}

