import * as cdk from '@aws-cdk/core';
import {
  DefaultInstanceTenancy,
  RouterType,
  Vpc,
  Subnet,
  CfnInternetGateway,
  CfnVPCGatewayAttachment,
  SecurityGroup,
  Peer,
  Port
} from "@aws-cdk/aws-ec2";

export class AwsTutorialStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "cdk-vpc", {
      cidr: "10.0.0.0/16",
      defaultInstanceTenancy: DefaultInstanceTenancy.DEFAULT,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: []
    });

    const publicSubnet_1 = new Subnet(this, "PublicSubnet1a", {
      availabilityZone: "ap-northeast-1a",
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.10.0/24"
    });
    const publicSubnet_2 = new Subnet(this, "PublicSubnet1c", {
      availabilityZone: "ap-northeast-1c",
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.20.0/24"
    });
    const privateSubnet_1 = new Subnet(this, "PrivatSubnet1a", {
      availabilityZone: "ap-northeast-1a",
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.30.0/24"
    });
    const privateSubnet_2 = new Subnet(this, "PrivatSubnet1c", {
      availabilityZone: "ap-northeast-1c",
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.40.0/24"
    });

    const internetGateway = new CfnInternetGateway(this, "InternetGateway", {});
    new CfnVPCGatewayAttachment(this, "gateway", {
      vpcId: vpc.vpcId,
      internetGatewayId: internetGateway.ref
    });

    publicSubnet_1.addRoute("PublicSubnet1Route", {
      routerType: RouterType.GATEWAY,
      routerId: internetGateway.ref
    });
    publicSubnet_2.addRoute("PublicSubnet2Route", {
      routerType: RouterType.GATEWAY,
      routerId: internetGateway.ref
    });

    const cidrIp = this.node.tryGetContext('cidr_ip');

    // 踏み台サーバー
    const sgBastion = new SecurityGroup(this, "sg-bastion", {
      vpc,
      allowAllOutbound: true,
      description: "for bastion server",
      securityGroupName: "bastion"
    });
    sgBastion.addIngressRule(
      Peer.anyIpv4(), // とりあえずどこからでもアクセス許可とする
      Port.tcp(22)
    );

    // Webサーバー
    const sgWeb = new SecurityGroup(this, "sg-web", {
      vpc,
      allowAllOutbound: true,
      description: "for web server",
      securityGroupName: "web"
    });
    sgWeb.addIngressRule(
      sgBastion,
      Port.tcp(22)
    );
    sgWeb.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80)
    );

    // Appサーバー
    const sgApp = new SecurityGroup(this, "sg-app", {
      vpc,
      allowAllOutbound: true,
      description: "for app server",
      securityGroupName: "app"
    });
    sgApp.addIngressRule(
      sgBastion,
      Port.tcp(22)
    );
    sgApp.addIngressRule(
      sgBastion,
      Port.tcp(3000)
    );

    // DBサーバー
    const sgDb = new SecurityGroup(this, "sg-db", {
      vpc,
      allowAllOutbound: true,
      description: "for db server",
      securityGroupName: "db"
    });
    sgDb.addIngressRule(
      sgBastion,
      Port.tcp(22)
    );
    sgDb.addIngressRule(
      sgBastion,
      Port.tcp(27017)
    );
  }
}
