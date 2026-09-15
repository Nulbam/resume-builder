import os
import sys
import logging
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import errors

import warnings

# SDK 내부 알림 문구 필터링 (터미널 로그를 깔끔하게 유지)
warnings.filterwarnings("ignore")

# 1. 환경변수 로드 (.env 파일에서 읽기)
load_dotenv()

# 2. 로깅 설정 (요청, 응답, 오류를 백엔드 콘솔에 명확하게 출력)
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ResumeBuilder")

# 3. Flask 앱 초기화
app = Flask(__name__)

# 4. Gemini API 클라이언트 초기화
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("경고: .env 파일에 GEMINI_API_KEY가 설정되지 않았습니다.")

# 사용할 Gemini 모델명 (가볍고 빠른 초경량 최신 모델)
MODEL_NAME = "gemini-3.5-flash-lite"


def build_prompt(name: str, job_title: str, experience: str, projects: str, tone: str, prompt_type: str, template_style: str = "sample1") -> str:
    """사용자 입력, 프롬프트 스타일, 선택한 템플릿 양식에 맞춰 Gemini에게 전달할 프롬프트를 구성합니다."""
    
    if prompt_type == "B":
        # Prompt B: 전문가 모드 (STAR 기법, 정량적 성과, 비즈니스 임팩트 극대화)
        role_instruction = (
            "당신은 대기업 및 유수 테크 기업의 최고 채용 전문가(Senior Recruiter & Resume Writer)입니다. "
            "지원자의 역량을 비즈니스 임팩트와 문제 해결력 중심으로 극대화하여 전문적이고 설득력 있는 문서로 작성해야 합니다.\n\n"
            "작성 가이드라인:\n"
            "1. STAR 기법(Situation, Task, Action, Result)을 적용하여 구체적이고 체계적으로 서술하세요.\n"
            "2. 수치화 가능한 성과 지표(Metrics), 기술 스택의 깊이, 주도적인 기여도를 강조하세요.\n"
            "3. 어조는 자신감 있고 전문적이며 신뢰감을 주는 전문가 톤을 유지하세요."
        )
    else:
        # Prompt A: 일반 모드 (균형 잡힌 표준 이력서, 가독성과 성장 잠재력 중심)
        role_instruction = (
            "당신은 친절하고 꼼꼼한 커리어 코치이자 이력서 컨설턴트입니다. "
            "지원자의 강점과 열정, 성장 잠재력이 잘 드러나도록 읽기 쉽고 단정한 이력서와 포트폴리오를 작성해야 합니다.\n\n"
            "작성 가이드라인:\n"
            "1. 지원자의 학습 태도, 협업 역량, 잠재력을 균형 있게 강조하세요.\n"
            "2. 명확하고 깔끔한 문장 구조를 사용하며, 가독성을 최우선으로 고려하세요.\n"
            "3. 누구나 편안하고 긍정적으로 읽을 수 있는 단정하고 설득력 있는 톤을 유지하세요."
        )

    # 템플릿 양식별 특화 지시사항
    if template_style == "sample1":
        template_guide = (
            "[디자인 양식: 모던 오렌지 2단 템플릿]\n"
            "- 상단 헤더: 지원자의 핵심 프로필 요약과 인적사항을 인상 깊게 배치하세요.\n"
            "- 핵심 역량(좌측 사이드바 대응): 보유 역량, 핵심 스킬, 자격증을 키워드 중심으로 명확히 구분하세요.\n"
            "- 상세 경력 및 프로젝트(우측 메인 대응): 실무 경험과 문제 해결 과정을 체계적인 소제목으로 작성하세요."
        )
    elif template_style == "minimal":
        template_guide = (
            "[디자인 양식: 심플 모노크롬 템플릿]\n"
            "- 미니멀하고 담백하게 핵심 경력과 성과 중심의 불릿 포인트로 작성하세요."
        )
    else:
        template_guide = (
            "[디자인 양식: 클래식 베이지 템플릿]\n"
            "- 전통적인 문서 양식에 맞춰 차분하고 신뢰감 있는 표준 문장으로 작성하세요."
        )

    prompt = f"""{role_instruction}

{template_guide}

[지원자 정보]
- 이름: {name}
- 지원 직무: {job_title}
- 경력 사항: {experience}
- 주요 프로젝트: {projects}
- 요청 어조(Tone): {tone}

[출력 형식 규칙]
반드시 아래의 마크다운 구분을 정확하게 지켜서 작성해 주세요. 
이력서와 포트폴리오는 각각 독립적으로 완전한 형식을 갖추어야 합니다.

[RESUME_START]
# {name} - {job_title} 이력서
(지원자의 프로필 요약, 핵심 역량, 상세 경력 기술서, 학력 및 기타 정보 등을 마크다운으로 충실하게 작성)
[RESUME_END]

[PORTFOLIO_START]
# {name} - {job_title} 포트폴리오
(프로젝트 개요, 배경/목표, 담당 역할, 사용 기술, 핵심 문제 해결 과정 및 성과, 배운 점 등을 마크다운으로 상세하게 작성)
[PORTFOLIO_END]
"""
    return prompt


@app.route("/")
def index():
    """메인 페이지 라우트: 브라우저에 화면(index.html)을 보여줍니다."""
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    """Gemini API를 호출하여 이력서와 포트폴리오를 생성하는 REST API 엔드포인트"""
    try:
        # 1. 요청 데이터 확인
        data = request.get_json()
        if not data:
            logger.warning("[입력 검증 실패] 요청 데이터가 비어 있습니다.")
            return jsonify({
                "success": False,
                "error": "요청 데이터가 올바르지 않습니다. JSON 형식으로 전달해 주세요."
            }), 400

        name = data.get("name", "").strip()
        job_title = data.get("job_title", "").strip()
        experience = data.get("experience", "").strip()
        projects = data.get("projects", "").strip()
        tone = data.get("tone", "전문적인").strip()
        prompt_type = data.get("prompt_type", "A").strip().upper()
        template_style = data.get("template_style", "sample1").strip()

        # 2. 백엔드 필수 입력값 검증
        if not name:
            return jsonify({"success": False, "error": "이름을 입력해 주세요."}), 400
        if not job_title:
            return jsonify({"success": False, "error": "지원 직무를 입력해 주세요."}), 400
        if not experience:
            return jsonify({"success": False, "error": "경력 사항을 입력해 주세요."}), 400
        if not projects:
            return jsonify({"success": False, "error": "프로젝트 경험을 입력해 주세요."}), 400

        # 백엔드 요청 로그 출력
        logger.info("=" * 50)
        logger.info("[요청 수신] /generate API 호출")
        logger.info(f"- 이름: {name}")
        logger.info(f"- 지원 직무: {job_title}")
        logger.info(f"- Tone: {tone}")
        logger.info(f"- 디자인 템플릿: {template_style}")
        logger.info(f"- 프롬프트 모드: Prompt {prompt_type} ({'전문가 모드' if prompt_type == 'B' else '일반 모드'})")

        # 3. API Key 존재 여부 점검
        if not GEMINI_API_KEY:
            logger.error("[인증 오류] GEMINI_API_KEY가 .env 파일에 누락되었습니다.")
            return jsonify({
                "success": False,
                "error": "서버에 Gemini API Key가 설정되어 있지 않습니다. .env 파일을 확인해 주세요."
            }), 500

        # 4. 프롬프트 구성 및 Gemini API 호출
        full_prompt = build_prompt(name, job_title, experience, projects, tone, prompt_type, template_style)
        logger.info("[Gemini API 호출 시작] 모델: %s", MODEL_NAME)

        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=full_prompt,
        )

        generated_text = response.text or ""
        logger.info("[Gemini API 응답 완료] 생성된 텍스트 길이: %d자", len(generated_text))
        logger.info("=" * 50)

        # 5. 이력서와 포트폴리오 파싱
        resume_text = ""
        portfolio_text = ""

        if "[RESUME_START]" in generated_text and "[RESUME_END]" in generated_text:
            resume_part = generated_text.split("[RESUME_START]")[1].split("[RESUME_END]")[0].strip()
            resume_text = resume_part
        if "[PORTFOLIO_START]" in generated_text and "[PORTFOLIO_END]" in generated_text:
            portfolio_part = generated_text.split("[PORTFOLIO_START]")[1].split("[PORTFOLIO_END]")[0].strip()
            portfolio_text = portfolio_part

        # 구분자가 누락되었을 경우 전체 텍스트를 기본값으로 안전하게 제공
        if not resume_text and not portfolio_text:
            resume_text = generated_text
            portfolio_text = ""

        # 전체 마크다운 결합본 (다운로드용)
        combined_markdown = f"{resume_text}\n\n---\n\n{portfolio_text}".strip()

        return jsonify({
            "success": True,
            "resume": resume_text,
            "portfolio": portfolio_text,
            "full_markdown": combined_markdown,
            "template_style": template_style
        })

    except errors.APIError as api_err:
        logger.error(f"[Gemini API 오류] {api_err}", exc_info=True)
        return jsonify({
            "success": False,
            "error": f"AI 모델 호출 중 오류가 발생했습니다: {str(api_err)}"
        }), 500
    except Exception as e:
        logger.error(f"[서버 내부 오류] {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "서버 처리 중 예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        }), 500


if __name__ == "__main__":
    logger.info("Flask 서버를 시작합니다 (PC: http://127.0.0.1:5000 | 모바일: 동일 Wi-Fi 접속 가능)")
    app.run(host="0.0.0.0", port=5000, debug=True)
