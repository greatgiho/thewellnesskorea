import { Link, Section, Text } from "@react-email/components"
import { BaseEmail, styles } from "./base"

export type TeacherCredentialsEmailProps = {
  nameKo: string
  email: string
  tempPassword: string
  loginUrl: string
  isReissue: boolean
}

export function TeacherCredentialsEmail({
  nameKo,
  email,
  tempPassword,
  loginUrl,
  isReissue,
}: TeacherCredentialsEmailProps) {
  const intro = isReissue
    ? `${nameKo}님, 요청하신 임시 비밀번호입니다.`
    : `${nameKo}님, The Wellness Korea 선생님 개인 페이지 계정이 발급되었습니다.`

  return (
    <BaseEmail preview={isReissue ? "임시 비밀번호가 재발급되었습니다." : "선생님 계정이 발급되었습니다."}>
      <Section>
        <Text style={styles.p}>{intro}</Text>
      </Section>

      <Section>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
          <tbody>
            <tr>
              <td style={{ ...styles.label, width: "140px" }}>로그인 주소</td>
              <td style={styles.value}>
                <Link href={loginUrl} style={{ color: "#1a1a1a" }}>
                  {loginUrl}
                </Link>
              </td>
            </tr>
            <tr>
              <td style={{ ...styles.label, width: "140px" }}>아이디(이메일)</td>
              <td style={styles.value}>{email}</td>
            </tr>
            <tr>
              <td style={{ ...styles.label, width: "140px", borderBottom: "none" }}>
                임시 비밀번호
              </td>
              <td
                style={{
                  ...styles.value,
                  borderBottom: "none",
                  fontFamily: "monospace",
                  fontSize: "17px",
                  fontWeight: "600",
                  letterSpacing: "1px",
                }}
              >
                {tempPassword}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section>
        <Text style={styles.pMuted}>
          보안을 위해 첫 로그인 후 비밀번호를 변경해 주세요.
        </Text>
      </Section>

      <Section style={{ margin: "24px 0" }}>
        <Link href={loginUrl} style={styles.button}>
          로그인하기
        </Link>
      </Section>
    </BaseEmail>
  )
}
